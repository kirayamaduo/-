package com.group1.career.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.common.Result;
import com.group1.career.exception.BizException;
import com.group1.career.model.entity.Interview;
import com.group1.career.model.entity.InterviewMessage;
import com.group1.career.service.AiService;
import com.group1.career.service.BodyLanguageService;
import com.group1.career.service.InterviewService;
import com.group1.career.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Post-interview review report.
 *
 * The first request for an interview that has at least one user-turn triggers a
 * single AI call which returns structured JSON (radar scores, strengths,
 * improvements, summary). The result is cached on the Interview row
 * (report_json + final_score), so subsequent views are free.
 */
@Slf4j
@Tag(name = "Interview Report API", description = "Post-interview review report generation")
@RestController
@RequestMapping("/api/interviews/report")
@RequiredArgsConstructor
public class InterviewReportController {

    private final InterviewService interviewService;
    private final AiService aiService;
    private final BodyLanguageService bodyLanguageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Operation(summary = "Get (or generate) the AI evaluation report for an interview")
    @GetMapping("/{interviewId}")
    public Result<InterviewReportDto> generateReport(@PathVariable Long interviewId) {
        Long uid = SecurityUtil.requireCurrentUserId();
        Interview interview = interviewService.assertOwnership(interviewId, uid);

        // 1) Fast path: cached
        if (interview.getReportJson() != null && !interview.getReportJson().isBlank()) {
            try {
                InterviewReportDto cached = objectMapper.readValue(interview.getReportJson(), InterviewReportDto.class);
                if (cached.getMode() == null || cached.getMode().isBlank()) {
                    cached.setMode(interview.getMode());
                }
                return Result.success(cached);
            } catch (JsonProcessingException e) {
                log.warn("Cached report JSON for interview {} is corrupt; regenerating", interviewId, e);
            }
        }

        // 2) Build transcript
        List<InterviewMessage> messages = interviewService.getInterviewMessages(interviewId);
        long userTurns = messages.stream().filter(m -> "USER".equalsIgnoreCase(m.getRole())).count();
        if (userTurns == 0) {
            throw new BizException("Interview has no candidate answers yet — cannot evaluate");
        }

        StringBuilder transcript = new StringBuilder();
        for (InterviewMessage msg : messages) {
            String tag = "USER".equalsIgnoreCase(msg.getRole()) ? "Candidate" : "Interviewer";
            transcript.append("[").append(tag).append("] ").append(msg.getContent()).append("\n");
        }

        // 3) Single AI call -> structured JSON
        String prompt = buildEvaluationPrompt(
                interview.getPositionName(),
                interview.getDifficulty() == null ? "Normal" : interview.getDifficulty(),
                transcript.toString()
        );

        long t0 = System.currentTimeMillis();
        String raw = aiService.chat(prompt);
        log.info("[report] AI evaluation took {} ms for interview {}", System.currentTimeMillis() - t0, interviewId);

        InterviewReportDto report = parseReport(raw, interviewId, interview, (int) userTurns);

        // 3.5) Fold in body-language scores collected during the session.
        // We consume the buffer regardless so memory is freed even when no
        // dimensions were captured (e.g. text-only interview).
        BodyLanguageService.Aggregate body = bodyLanguageService.consume(interviewId);
        if (body != null && body.getFrames() > 0) {
            report.getRadarChart().setBodyLanguage(body.getBodyLanguage());
            report.setBodyLanguageAnalysis(toBodyLanguageAnalysis(body));
            // Recompute overallScore so the 6th dimension actually shifts
            // the headline number — otherwise body-language work feels
            // unrewarded.
            RadarChartData r = report.getRadarChart();
            int sum = r.getExpression() + r.getLogic() + r.getTechnical()
                    + r.getPressureResistance() + r.getCommunication() + r.getBodyLanguage();
            report.setOverallScore(Math.max(0, Math.min(100, sum / 6)));
        }

        // 4) Cache + persist final_score
        try {
            String json = objectMapper.writeValueAsString(report);
            interviewService.saveReport(interviewId, json, report.getOverallScore());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize report for interview {}", interviewId, e);
        }

        return Result.success(report);
    }

    // ============================================================
    private String buildEvaluationPrompt(String position, String difficulty, String transcript) {
        return "你是一名资深招聘面试官。请只根据下面的面试记录评估候选人，不要引入记录之外的信息。 " +
               "所有文本内容必须使用简体中文。返回严格 JSON，不要 Markdown，不要额外解释，结构如下：\n" +
               "{\n" +
               "  \"overallScore\": <int 0-100>,\n" +
               "  \"radarChart\": {\n" +
               "    \"expression\": <int 0-100>,\n" +
               "    \"logic\": <int 0-100>,\n" +
               "    \"technical\": <int 0-100>,\n" +
               "    \"pressureResistance\": <int 0-100>,\n" +
               "    \"communication\": <int 0-100>\n" +
               "  },\n" +
               "  \"strengths\": [ {\"title\": \"中文优势标题\", \"detail\": \"中文证据说明\"} ],\n" +
               "  \"improvements\": [ {\"title\": \"中文改进标题\", \"detail\": \"中文改进建议\"} ],\n" +
               "  \"summary\": \"2-3 句中文总体结论。\"\n" +
               "}\n\n" +
               "请给出 1-3 条优势和 1-3 条改进建议。每条 detail 要引用候选人实际表达中的证据，控制在 200 个汉字以内。\n\n" +
               "=== 岗位 ===\n" + position + "（难度：" + difficulty + "）\n\n" +
               "=== 面试记录 ===\n" + transcript;
    }

    private InterviewReportDto parseReport(String raw, Long interviewId, Interview interview, int userTurns) {
        if (raw == null) raw = "";
        String cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            int firstNl = cleaned.indexOf('\n');
            if (firstNl > 0) cleaned = cleaned.substring(firstNl + 1);
            int closing = cleaned.lastIndexOf("```");
            if (closing > 0) cleaned = cleaned.substring(0, closing);
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }

        try {
            JsonNode node = objectMapper.readTree(cleaned);
            RadarChartData radar = RadarChartData.builder()
                    .expression(intField(node, "radarChart", "expression", 70))
                    .logic(intField(node, "radarChart", "logic", 70))
                    .technical(intField(node, "radarChart", "technical", 70))
                    .pressureResistance(intField(node, "radarChart", "pressureResistance", 70))
                    .communication(intField(node, "radarChart", "communication", 70))
                    .build();

            int overall = node.path("overallScore").asInt(
                    (radar.getExpression() + radar.getLogic() + radar.getTechnical()
                            + radar.getPressureResistance() + radar.getCommunication()) / 5);

            return InterviewReportDto.builder()
                    .interviewId(interviewId)
                    .positionName(interview.getPositionName())
                    .difficulty(interview.getDifficulty())
                    .mode(interview.getMode())
                    .durationSeconds(interview.getDurationSeconds())
                    .overallScore(Math.max(0, Math.min(100, overall)))
                    .totalQuestions(userTurns)
                    .radarChart(radar)
                    .strengths(toAdvice(node.path("strengths")))
                    .improvements(toAdvice(node.path("improvements")))
                    .textSummary(node.path("summary").asText(""))
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse AI report JSON for interview {}: {}", interviewId, raw, e);
            throw new BizException("AI returned an unparseable evaluation. Please retry.");
        }
    }

    private int intField(JsonNode root, String parent, String key, int fallback) {
        JsonNode p = root.path(parent);
        if (p.isMissingNode()) return fallback;
        int v = p.path(key).asInt(fallback);
        return Math.max(0, Math.min(100, v));
    }

    private List<AdviceItem> toAdvice(JsonNode arr) {
        List<AdviceItem> out = new ArrayList<>();
        if (arr == null || !arr.isArray()) return out;
        for (JsonNode it : arr) {
            String title = it.path("title").asText("");
            String detail = it.path("detail").asText("");
            if (!title.isBlank() || !detail.isBlank()) {
                out.add(new AdviceItem(title, detail));
            }
        }
        return out;
    }

    private BodyLanguageAnalysis toBodyLanguageAnalysis(BodyLanguageService.Aggregate body) {
        return BodyLanguageAnalysis.builder()
                .eyeContact(body.getEyeContact())
                .expression(body.getExpression())
                .posture(body.getPosture())
                .bodyLanguage(body.getBodyLanguage())
                .averageConfidence(body.getAverageConfidence())
                .frames(body.getFrames())
                .summary(buildBodySummary(body))
                .build();
    }

    private String buildBodySummary(BodyLanguageService.Aggregate body) {
        int score = body.getBodyLanguage();
        if (score >= 85) return "行为表现稳定，眼神、表情和坐姿整体传递出较强的投入感。";
        if (score >= 70) return "行为表现基本稳定，建议继续保持镜头视线和坐姿一致性。";
        if (score >= 55) return "行为表现有一定波动，建议减少低头、晃动和表情空白时间。";
        return "行为表现信号偏弱，建议练习看向镜头、保持坐姿稳定，并用自然表情回应问题。";
    }

    // ================= DTO Classes =================

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class InterviewReportDto {
        private Long interviewId;
        private String positionName;
        private String difficulty;
        private String mode;
        private Integer durationSeconds;
        private int overallScore;
        private int totalQuestions;
        private RadarChartData radarChart;
        private BodyLanguageAnalysis bodyLanguageAnalysis;
        private List<AdviceItem> strengths;
        private List<AdviceItem> improvements;
        private String textSummary;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RadarChartData {
        private int expression;
        private int logic;
        private int technical;
        private int pressureResistance;
        private int communication;
        /** Sprint C-1 — averaged body-language composite (eye contact + expression + posture).
         *  Null when no frames were collected for the interview (text mode). */
        private Integer bodyLanguage;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class AdviceItem {
        private String title;
        private String detail;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class BodyLanguageAnalysis {
        private int eyeContact;
        private int expression;
        private int posture;
        private int bodyLanguage;
        private double averageConfidence;
        private int frames;
        private String summary;
    }
}
