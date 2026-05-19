package com.group1.career.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.common.Result;
import com.group1.career.exception.BizException;
import com.group1.career.model.entity.Resume;
import com.group1.career.model.NotificationTypes;
import com.group1.career.service.AiService;
import com.group1.career.service.FileService;
import com.group1.career.service.NotificationService;
import com.group1.career.service.ResumeService;
import com.group1.career.service.UserProfileTagService;
import com.group1.career.utils.PdfTextExtractor;
import com.group1.career.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * AI-powered resume analysis. Accepts a resumeId (the resume's PDF lives in OSS),
 * downloads & extracts text via PDFBox, then calls Aliyun Qwen with a structured
 * prompt requesting JSON output. Falls back to heuristic parsing if the model
 * returns prose instead of JSON.
 */
@Slf4j
@Tag(name = "Resume Diagnosis API", description = "AI-powered resume analysis and scoring")
@RestController
@RequestMapping("/api/resume-diagnosis")
@RequiredArgsConstructor
public class ResumeDiagnosisController {

    private final AiService aiService;
    private final ResumeService resumeService;
    private final FileService fileService;
    private final NotificationService notificationService;
    private final UserProfileTagService profileTagService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Operation(summary = "Trigger AI resume diagnosis (resumeId-based, real Qwen call)")
    @PostMapping("/analyze")
    // 不加 @Transactional：此方法调用外部 AI 接口（最长 90s），持有数据库事务会耗尽连接池
    // 并在事务 cleanup 时抛 TransactionException（前端误读为 "translation error"）
    // 读数据库操作（assertOwnership、downloadBytes）各自在自己的短事务中完成
    public Result<DiagnosisResultDto> triggerDiagnosis(@RequestBody DiagnosisRequestDto request) {
        // 1. Resolve resume text: prefer raw resumeText (template/AI-generated case),
        //    otherwise fetch the persisted resume and extract its OSS PDF.
        String resumeText = request.getResumeText();
        Long resumeId = request.getResumeId();

        if ((resumeText == null || resumeText.isBlank()) && resumeId != null) {
            // Enforce that the caller actually owns the resume they're asking us to analyze.
            Long uid = SecurityUtil.requireCurrentUserId();
            Resume resume = resumeService.assertOwnership(resumeId, uid);
            if (resume.getParsedContent() != null && !resume.getParsedContent().isBlank()) {
                resumeText = resume.getParsedContent();
            } else if (resume.getFileUrl() != null && !resume.getFileUrl().isBlank()) {
                byte[] pdfBytes = fileService.downloadBytes(resume.getFileUrl());
                resumeText = PdfTextExtractor.extractFromBytes(pdfBytes);
            }
        }

        if (resumeText == null || resumeText.isBlank()) {
            throw new BizException("Resume content is empty or could not be parsed");
        }

        String jd = request.getJobDescription() == null ? "" : request.getJobDescription();
        Long uid = SecurityUtil.currentUserId();
        String prompt = buildPrompt(resumeText, jd, uid == null ? "" : profileTagService.renderForPrompt(uid));

        // 2. Call AI
        String aiResponse = aiService.chat(prompt);

        // 3. Parse structured response
        DiagnosisResultDto result = parseAiResponse(aiResponse);
        result.setResumeId(resumeId);
        result.setRawAnalysis(aiResponse);

        // F9: push in-app notification so the user can find the result in Messages
        if (uid != null) {
            notificationService.push(uid,
                    NotificationTypes.RESUME_DIAGNOSIS,
                    "简历诊断已完成",
                    "你的简历匹配分为 " + result.getOverallScore() + "/100，点击查看优势、短板和修改建议。",
                    "/pages/resume-ai/index");
        }

        return Result.success(result);
    }

    private String buildPrompt(String resumeText, String jd, String profileContext) {
        return "你是一名资深 HR 和简历评审专家。请根据目标 JD 分析下面的简历，所有输出文本必须使用简体中文。 " +
               "请结合结构化用户画像中的技能、背景、成长方向和目标。如果简历遗漏了画像中能支撑岗位的技能或经历，请在建议里指出。\n\n" +
               (profileContext == null ? "" : profileContext) + "\n\n" +
               "只返回严格 JSON，不要 Markdown，不要额外说明，结构如下：\n" +
               "{\n" +
               "  \"overallScore\": <0-100 的整数，表示简历与 JD 的匹配度>,\n" +
               "  \"strengths\": [\"中文优势\", \"中文优势\"],\n" +
               "  \"weaknesses\": [\"中文短板\", \"中文短板\"],\n" +
               "  \"suggestions\": [\"中文修改建议\", \"中文修改建议\"]\n" +
               "}\n\n" +
               "评分依据：岗位关键词匹配、项目证据强度、能力表达清晰度、经历与目标岗位相关性。不要虚构经历或成果。\n\n" +
               "=== 目标 JD ===\n" + (jd.isBlank() ? "未提供具体 JD，请按通用求职简历标准评估" : jd) + "\n\n" +
               "=== 简历 ===\n" + resumeText;
    }

    private DiagnosisResultDto parseAiResponse(String aiResponse) {
        DiagnosisResultDto dto = new DiagnosisResultDto();
        if (aiResponse == null) {
            dto.setOverallScore(0);
            dto.setStrengths(List.of());
            dto.setWeaknesses(List.of());
            dto.setSuggestions(List.of());
            return dto;
        }

        String json = aiResponse.trim();
        int objStart = json.indexOf('{');
        int objEnd = json.lastIndexOf('}');
        if (objStart >= 0 && objEnd > objStart) {
            json = json.substring(objStart, objEnd + 1);
            try {
                JsonNode root = objectMapper.readTree(json);
                dto.setOverallScore(root.path("overallScore").asInt(75));
                dto.setStrengths(toList(root.path("strengths")));
                dto.setWeaknesses(toList(root.path("weaknesses")));
                dto.setSuggestions(toList(root.path("suggestions")));
                return dto;
            } catch (Exception e) {
                log.warn("AI JSON parse failed, falling back to prose: {}", e.getMessage());
            }
        }

        dto.setOverallScore(extractFirstNumber(aiResponse, 75));
        dto.setStrengths(List.of());
        dto.setWeaknesses(List.of());
        dto.setSuggestions(List.of(aiResponse));
        return dto;
    }

    private List<String> toList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> out.add(n.asText()));
        }
        return out;
    }

    private int extractFirstNumber(String s, int fallback) {
        try {
            String[] tokens = s.split("[^0-9]+");
            for (String t : tokens) {
                if (!t.isBlank()) {
                    int v = Integer.parseInt(t);
                    if (v >= 0 && v <= 100) return v;
                }
            }
        } catch (Exception ignored) {}
        return fallback;
    }

    @Data
    public static class DiagnosisRequestDto {
        private Long resumeId;
        /** Optional: pre-extracted text. If null, backend will pull resume.fileUrl from OSS. */
        private String resumeText;
        private String jobDescription;
    }

    @Data
    public static class DiagnosisResultDto {
        private Long resumeId;
        private int overallScore;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> suggestions;
        /** Raw LLM reply for debugging / fallback rendering */
        private String rawAnalysis;
    }
}
