package com.group1.career.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.model.entity.UserCareerPlan;
import com.group1.career.repository.UserCareerPlanRepository;
import com.group1.career.service.AiService;
import com.group1.career.service.CareerPlanService;
import com.group1.career.service.UserFactService;
import com.group1.career.service.UserProfileSnapshotService;
import com.group1.career.service.UserProfileTagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * F28c: AI personalised career plan — generation and retrieval.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CareerPlanServiceImpl implements CareerPlanService {

    private final UserCareerPlanRepository planRepository;
    private final AiService aiService;
    private final UserProfileSnapshotService profileSnapshotService;
    private final UserFactService userFactService;
    private final ObjectProvider<UserProfileTagService> profileTagServiceProvider;
    private final ObjectMapper objectMapper;

    private static final String PLAN_MODEL = "qwen-max";

    private static final String SYSTEM_PROMPT =
            "你是一位专业的职业规划顾问。根据用户个人情况输出个性化职业发展规划。" +
            "严格以合法JSON格式输出，不添加任何解释文字、markdown代码块或其他内容。";

    @Override
    public UserCareerPlan generate(Long userId, String targetRole) {
        String profileCtx = profileSnapshotService.renderForPrompt(userId);
        String factsCtx   = userFactService.renderForPrompt(userId);
        String tagsCtx    = profileTagServiceProvider.getObject().renderForPrompt(userId);

        String target = (targetRole != null && !targetRole.isBlank())
                ? targetRole.trim() : "互联网行业职位";

        String userPrompt = buildUserPrompt(target,
                String.join("\n", profileCtx == null ? "" : profileCtx, tagsCtx == null ? "" : tagsCtx).trim(),
                factsCtx);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", SYSTEM_PROMPT),
                Map.of("role", "user",   "content", userPrompt)
        );

        String aiRaw = null;
        try {
            aiRaw = aiService.chat(messages, PLAN_MODEL);
            String jsonStr = extractJson(aiRaw);
            JsonNode plan  = objectMapper.readTree(jsonStr);

            String planTarget    = plan.path("target_role").asText(target);
            String startState    = objectMapper.writeValueAsString(plan.path("start_state"));
            String milestones    = objectMapper.writeValueAsString(plan.path("milestones"));
            String weeklyFocus   = objectMapper.writeValueAsString(plan.path("weekly_focus"));

            return persist(userId, planTarget, startState, milestones, weeklyFocus, PLAN_MODEL);

        } catch (Exception e) {
            log.error("[F28c] plan generation failed for user={} error={}", userId, e.getMessage());
            // Graceful fallback — never leave the user with an empty plan
            return persist(userId, target,
                    "{}",
                    fallbackMilestones(),
                    fallbackWeeklyFocus(),
                    "fallback");
        }
    }

    @Override
    public Optional<UserCareerPlan> getCurrent(Long userId) {
        return planRepository.findByUserId(userId);
    }

    @Override
    @Async
    public void regenerateAsync(Long userId) {
        try {
            Optional<UserCareerPlan> existing = planRepository.findByUserId(userId);
            String role = existing.map(UserCareerPlan::getTargetRole).orElse(null);
            generate(userId, role);
        } catch (Exception e) {
            log.error("[F28c] async regeneration failed for user={}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Async
    public void regenerateWithRoleAsync(Long userId, String targetRole) {
        try {
            generate(userId, targetRole);
        } catch (Exception e) {
            log.error("[F28c] async regeneration (new role) failed for user={}: {}", userId, e.getMessage());
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private UserCareerPlan persist(Long userId, String targetRole,
                                   String startState, String milestones,
                                   String weeklyFocus, String model) {
        UserCareerPlan plan = planRepository.findByUserId(userId)
                .orElseGet(() -> UserCareerPlan.builder()
                        .userId(userId)
                        .tokensConsumed(0)
                        .version(0)
                        .build());

        plan.setTargetRole(targetRole);
        plan.setStartStateJson(startState);
        plan.setMilestonesJson(milestones);
        plan.setWeeklyFocusJson(weeklyFocus);
        plan.setModelUsed(model);
        plan.setLastUpdatedAt(LocalDateTime.now());
        plan.setVersion(plan.getVersion() == null ? 1 : plan.getVersion() + 1);

        if (plan.getGeneratedAt() == null) {
            plan.setGeneratedAt(LocalDateTime.now());
        }
        return planRepository.save(plan);
    }

    /** Strip markdown code fences and find the outermost JSON object. */
    private String extractJson(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        if (s.startsWith("```")) {
            int nl  = s.indexOf('\n');
            int end = s.lastIndexOf("```");
            if (nl >= 0 && end > nl) s = s.substring(nl + 1, end).trim();
        }
        int start = s.indexOf('{');
        int end   = s.lastIndexOf('}');
        return (start >= 0 && end > start) ? s.substring(start, end + 1) : s;
    }

    private String buildUserPrompt(String target, String profileCtx, String factsCtx) {
        return """
请为以下用户生成职业发展规划：

目标职位：%s

用户基本情况：
%s

AI已了解到的用户信息：
%s

请生成如下JSON格式的规划（JSON必须合法，所有字段都要填写）：
{
  "target_role": "具体目标职位（精确描述，例如：字节跳动产品经理P5）",
  "start_state": {
    "education": "当前学历与院校",
    "skills": ["技能1", "技能2"],
    "experience": "实习与项目经历摘要"
  },
  "milestones": [
    {
      "horizon": "6m",
      "title": "6个月内的阶段目标",
      "skills": ["需要掌握的技能"],
      "actions": ["具体可执行的行动1", "具体可执行的行动2"],
      "kpis": ["衡量成功的指标"]
    },
    {"horizon": "1y", "title": "1年目标", "skills": [], "actions": [], "kpis": []},
    {"horizon": "3y", "title": "3年目标", "skills": [], "actions": [], "kpis": []},
    {"horizon": "5y", "title": "5年目标", "skills": [], "actions": [], "kpis": []}
  ],
  "weekly_focus": [
    "本周最重要的可执行行动1（具体、可操作）",
    "本周最重要的可执行行动2",
    "本周最重要的可执行行动3"
  ]
}
""".formatted(
                target,
                profileCtx.isBlank() ? "暂无资料，请先完成测评和简历上传" : profileCtx,
                factsCtx.isBlank()   ? "暂无已知信息" : factsCtx
        );
    }

    private String fallbackMilestones() {
        return """
[
  {"horizon":"6m","title":"夯实核心技能基础","skills":[],"actions":["系统学习目标岗位核心技能","完成2个以上实践项目"],"kpis":["掌握岗位所需技术栈"]},
  {"horizon":"1y","title":"获得相关实习或初级岗位","skills":[],"actions":["精心准备简历和作品集","积极投递目标公司"],"kpis":["拿到至少1个满意的offer"]},
  {"horizon":"3y","title":"成为领域内的中级人才","skills":[],"actions":["深耕专业方向","建立职业人脉"],"kpis":["薪资达到行业中位线以上"]},
  {"horizon":"5y","title":"成长为高级或专家职位","skills":[],"actions":["承担更大责任","形成个人影响力"],"kpis":["担任高级职位或成为领域专家"]}
]""";
    }

    private String fallbackWeeklyFocus() {
        return """
["完善个人简历，突出核心优势与项目经验","每天刷2道算法/专业题保持练习","研究1-2家目标公司的业务模式和招聘要求"]""";
    }
}
