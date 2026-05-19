package com.group1.career.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.entity.*;
import com.group1.career.repository.*;
import com.group1.career.service.AiService;
import com.group1.career.model.NotificationTypes;
import com.group1.career.service.AssessmentService;
import com.group1.career.service.CheckInService;
import com.group1.career.service.WechatSubscribeService;
import com.group1.career.service.NotificationService;
import com.group1.career.service.UserProfileSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentServiceImpl implements AssessmentService {

    private final AssessmentScaleRepository scaleRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentOptionRepository optionRepository;
    private final AssessmentRecordRepository recordRepository;
    private final AssessmentAnswerRepository answerRepository;
    private final ObjectMapper objectMapper;
    private final AiService aiService;
    private final NotificationService notificationService;
    private final UserProfileSnapshotService snapshotService;
    private final CheckInService checkInService;
    private final WechatSubscribeService wechatSubscribeService;

    @Override
    public List<AssessmentScale> getAllScales() {
        return scaleRepository.findByIsActiveTrueOrderByScaleIdAsc();
    }

    @Override
    public List<AssessmentQuestion> getScaleQuestions(Long scaleId) {
        return questionRepository.findByScaleIdAndIsActiveTrueOrderBySortOrderAsc(scaleId);
    }

    @Override
    @Transactional
    public AssessmentRecord submitAndScore(Long userId, Long scaleId, Map<Long, Long> answers) {
        AssessmentScale scale = scaleRepository.findById(scaleId)
                .orElseThrow(() -> new RuntimeException("Scale not found: " + scaleId));

        List<Long> questionIds = new ArrayList<>(answers.keySet());
        List<Long> optionIds = new ArrayList<>(answers.values());
        List<AssessmentOption> selectedOptions = optionRepository.findByQuestionIdIn(questionIds);

        Map<Long, AssessmentOption> optionMap = selectedOptions.stream()
                .filter(o -> optionIds.contains(o.getOptionId()))
                .collect(Collectors.toMap(AssessmentOption::getOptionId, o -> o));

        Map<String, Integer> traitCounts = new HashMap<>();
        List<AssessmentAnswer> answerEntities = new ArrayList<>();

        for (Map.Entry<Long, Long> entry : answers.entrySet()) {
            Long questionId = entry.getKey();
            Long optionId = entry.getValue();
            AssessmentOption option = optionMap.get(optionId);

            BigDecimal scoreSnapshot = BigDecimal.ZERO;
            if (option != null && option.getDimensionCode() != null) {
                traitCounts.merge(option.getDimensionCode(), 1, Integer::sum);
                scoreSnapshot = option.getScoreValue();
            }

            answerEntities.add(AssessmentAnswer.builder()
                    .questionId(questionId)
                    .optionId(optionId)
                    .scoreSnapshot(scoreSnapshot)
                    .build());
        }

        String portrait = generatePortrait(scale.getTitle(), traitCounts);

        String traitsJson = "{}";
        try {
            traitsJson = objectMapper.writeValueAsString(traitCounts);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize traits", e);
        }

        AssessmentRecord record = AssessmentRecord.builder()
                .userId(userId)
                .scaleId(scaleId)
                .status("COMPLETED")
                .resultSummary(portrait)
                .resultJson(traitsJson)
                .build();
        record = recordRepository.save(record);

        final Long recordId = record.getRecordId();
        answerEntities.forEach(a -> a.setRecordId(recordId));
        answerRepository.saveAll(answerEntities);

        // Best-effort AI insight generation. We swallow failures and just
        // leave aiInsight null -- the result page will fall back to the
        // generic copy and the user still gets their portrait + dimensions.
        String aiInsight = generateAiInsight(scale.getTitle(), portrait, traitsJson);
        if (aiInsight != null) {
            record.setAiInsight(aiInsight);
            record = recordRepository.save(record);
        }

        // Write into the cross-tool user portrait so resume diagnosis /
        // interview start / assistant can all see this result without a
        // separate query. Best-effort -- never fail the user's submission
        // because the portrait write blew up.
        try {
            List<String> suggestedRoles = extractSuggestedRoles(aiInsight);
            snapshotService.mergeAssessment(userId, UserProfileSnapshot.AssessmentBlock.builder()
                    .lastRecordId(record.getRecordId())
                    .scaleId(scaleId)
                    .scaleTitle(scale.getTitle())
                    .summary(portrait)
                    .suggestedRoles(suggestedRoles)
                    .completedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("[assessment] snapshot merge failed for user {}: {}", userId, e.toString());
        }

        // Push a notification so this result is reachable from Messages too.
        notificationService.push(
                userId,
                NotificationTypes.ASSESSMENT_RESULT,
                scale.getTitle() + " 已完成",
                "你的测评结果是：" + (portrait == null || portrait.isBlank() ? "已计算完成" : portrait) +
                        "。点击查看维度拆解和岗位建议。",
                "/pages/assessment/result?recordId=" + record.getRecordId()
        );

        // Stamp the daily check-in. Best-effort — never fail the submission
        // because the streak engine hiccuped.
        try {
            checkInService.recordAction(userId, "ASSESSMENT");
        } catch (Exception e) {
            log.warn("[assessment] check-in record failed for user {}: {}", userId, e.toString());
        }

        try {
            wechatSubscribeService.sendAssessmentResult(userId, scale.getTitle(), portrait);
        } catch (Exception e) {
            log.warn("[assessment] wx subscribe push failed for user {}: {}", userId, e.toString());
        }

        return record;
    }

    /**
     * Pull the {@code suggestedRoles} array out of the AI insight JSON we
     * just persisted. Returns an empty list on any failure -- this only
     * feeds the snapshot, never the primary assessment write.
     */
    private List<String> extractSuggestedRoles(String aiInsightJson) {
        if (aiInsightJson == null || aiInsightJson.isBlank()) return List.of();
        try {
            JsonNode root = objectMapper.readTree(aiInsightJson);
            JsonNode roles = root.get("suggestedRoles");
            if (roles == null || !roles.isArray()) return List.of();
            List<String> out = new ArrayList<>();
            roles.forEach(n -> {
                if (n != null && n.isTextual()) out.add(n.asText());
            });
            return out;
        } catch (Exception e) {
            return List.of();
        }
    }

    /**
     * Ask the LLM for a personalised, JSON-structured analysis of this
     * particular result. Returns the raw JSON string ready to be stored
     * verbatim in {@code ai_insight}, or {@code null} if anything goes wrong.
     */
    private String generateAiInsight(String scaleTitle, String portrait, String traitsJson) {
        if (portrait == null || portrait.isBlank() || "N/A".equals(portrait)) return null;
        try {
            String prompt = """
                    你是一名资深职业咨询师，正在分析候选人的 %s 测评结果。
                    候选人的画像代码是 "%s"，各维度计数是：%s。

                    请只返回一个 JSON 对象，不要 Markdown，不要额外说明。所有文本必须使用简体中文，结构如下：
                    {
                      "strengths": "2-3 句中文，说明该画像对应的职业优势和适合的工作类型。",
                      "growth": "2-3 句中文，说明最值得提升的方向，要写成可执行建议，不要简单贴弱点标签。",
                      "suggestedRoles": ["3-5 个中文岗位名称"]
                    }

                    必须基于该画像代码和维度计数，不要给任何画像都适用的套话。语气温和、直接、具体。
                    """.formatted(scaleTitle, portrait, traitsJson);

            long t0 = System.currentTimeMillis();
            String raw = aiService.chat(prompt);
            log.info("[assessment] AI insight took {} ms for portrait={}", System.currentTimeMillis() - t0, portrait);

            String cleaned = stripJsonFences(raw);
            // Validate the model returned parseable JSON before persisting it.
            objectMapper.readTree(cleaned);
            return cleaned;
        } catch (Exception e) {
            log.warn("[assessment] AI insight generation failed: {}", e.toString());
            return null;
        }
    }

    /** Some Qwen replies wrap JSON in ```json ... ``` fences -- strip them. */
    private String stripJsonFences(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.startsWith("```")) {
            int firstNewline = s.indexOf('\n');
            if (firstNewline >= 0) s = s.substring(firstNewline + 1);
            if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        }
        // Sometimes the model returns extra text before/after the JSON object.
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) s = s.substring(start, end + 1);
        return s.trim();
    }

    @Override
    public List<AssessmentRecord> getUserRecords(Long userId) {
        return recordRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public AssessmentRecord getRecord(Long recordId) {
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found: " + recordId));
    }

    private String generatePortrait(String scaleTitle, Map<String, Integer> traits) {
        if (traits.isEmpty()) return "N/A";

        String title = scaleTitle.toUpperCase();
        if (title.contains("MBTI")) {
            StringBuilder sb = new StringBuilder();
            sb.append(get(traits, "E") >= get(traits, "I") ? "E" : "I");
            sb.append(get(traits, "S") >= get(traits, "N") ? "S" : "N");
            sb.append(get(traits, "T") >= get(traits, "F") ? "T" : "F");
            sb.append(get(traits, "J") >= get(traits, "P") ? "J" : "P");
            return sb.toString();
        } else {
            return traits.entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(3)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.joining());
        }
    }

    private int get(Map<String, Integer> map, String key) {
        return map.getOrDefault(key, 0);
    }
}
