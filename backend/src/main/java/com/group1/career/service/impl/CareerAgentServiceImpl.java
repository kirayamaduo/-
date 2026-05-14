package com.group1.career.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.model.dto.AgentBundleDto;
import com.group1.career.model.dto.AgentUserProfileDto;
import com.group1.career.model.dto.CareerAgentPlanDto;
import com.group1.career.model.dto.CareerAgentTodayDto;
import com.group1.career.model.dto.CareerAgentRiskDto;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.entity.AgentTask;
import com.group1.career.model.entity.User;
import com.group1.career.model.entity.UserCareerPlan;
import com.group1.career.repository.AgentTaskRepository;
import com.group1.career.repository.UserRepository;
import com.group1.career.service.AgentEventService;
import com.group1.career.service.AgentProfileService;
import com.group1.career.service.AgentReasonService;
import com.group1.career.service.AgentStateService;
import com.group1.career.service.CareerPlanService;
import com.group1.career.service.CareerAgentService;
import com.group1.career.service.CheckInService;
import com.group1.career.service.UserProfileSnapshotService;
import com.group1.career.exception.BizException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CareerAgentServiceImpl implements CareerAgentService {

    private static final int RESUME_SCORE_THRESHOLD = 70;
    private static final int INTERVIEW_SCORE_THRESHOLD = 70;
    private static final int RISK_HIGH_THRESHOLD = 70;
    private static final int RISK_MEDIUM_THRESHOLD = 40;
    private static final int MIN_CHECKIN_DAYS_PER_WEEK = 3;
    private static final int DISMISS_SUPPRESS_THRESHOLD = 2;
    private static final double COMPLETION_RATE_LOW = 0.3;
    private static final double COMPLETION_RATE_HIGH = 0.7;
    private static final int MAX_TASKS_LOW_COMPLETION = 2;

    private final UserRepository userRepository;
    private final UserProfileSnapshotService snapshotService;
    private final CheckInService checkInService;
    private final AgentTaskRepository taskRepository;
    private final CareerPlanService careerPlanService;
    private final AgentEventService agentEventService;
    private final AgentStateService agentStateService;
    private final AgentProfileService agentProfileService;
    private final AgentReasonService agentReasonService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public AgentBundleDto getBundle(Long userId) {
        CareerAgentTodayDto today = getToday(userId);
        List<AgentTask> tasks = taskRepository.findByUserIdAndDueDateOrderByCreatedAtDesc(userId, LocalDate.now());
        CareerAgentRiskDto risk = getRiskWatch(userId);
        CareerAgentPlanDto plan = getPlanSummary(userId);
        AgentUserProfileDto profile = agentProfileService.getProfile(userId);
        return AgentBundleDto.builder()
                .today(today)
                .tasks(tasks)
                .risk(risk)
                .plan(plan)
                .profile(profile)
                .build();
    }

    @Override
    @Transactional
    public CareerAgentTodayDto getToday(Long userId) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        CheckInService.CheckInStatus checkIn = checkInService.getStatus(userId);

        UserProfileSnapshot.AssessmentBlock assessment = snapshot.getAssessment();
        UserProfileSnapshot.ResumeBlock resume = snapshot.getResume();
        UserProfileSnapshot.InterviewBlock interview = snapshot.getInterview();
        UserProfileSnapshot.PreferencesBlock preferences = snapshot.getPreferences();
        UserProfileSnapshot.OnboardingBlock onboarding = snapshot.getOnboarding();

        String targetRole = firstText(
                preferences != null ? preferences.getTargetRole() : null,
                resume != null ? resume.getTargetJob() : null,
                interview != null ? interview.getPositionName() : null
        );
        String identityType = onboarding != null ? onboarding.getIdentityType() : null;
        String selfReportedResume = onboarding != null ? onboarding.getHasResume() : null;
        boolean selfReportedHasResume = "yes".equalsIgnoreCase(selfReportedResume);
        int progress = progress(assessment, resume, interview, targetRole, checkIn);
        List<String> risks = new ArrayList<>();
        List<String> riskKeys = new ArrayList<>();
        List<CareerAgentTodayDto.Action> actions = new ArrayList<>();

        String stage;
        String headline;
        String focus;
        String reason;

        if (!hasText(targetRole)) {
            stage = "TARGET_ROLE_SELECTION";
            headline = "先选择一个目标岗位方向";
            focus = "把求职准备收敛到一个具体岗位或方向";
            reason = "目标岗位还没有设定。先确定方向，后续简历、测评和面试任务才会更准确。";
            risks.add("目标岗位尚未设置");
            riskKeys.add("agent.risk.reason.NO_TARGET_ROLE");
            if (assessment == null) {
                risks.add("测评基线尚未建立");
                riskKeys.add("agent.risk.reason.NO_ASSESSMENT");
            }
            actions.add(action("选择目标岗位", "/pages/map/index", "TARGET_ROLE", "HIGH"));
            actions.add(action("完成职业测评", "/pages/assessment/index", "ASSESSMENT", "MEDIUM"));
        } else if ("career_switcher".equals(identityType)) {
            stage = "CAREER_SWITCH_POSITIONING";
            headline = "整理转岗理由和目标岗位证据";
            focus = "把过往经历改写成「" + targetRole + "」需要的能力证据";
            reason = "你在 onboarding 中选择了转方向。今天最重要的是先解释为什么转、凭什么能转，再进入简历细节。";
            risks.add("转岗叙事尚未沉淀");
            riskKeys.add("agent.risk.reason.PROFILE_MISSING");
            actions.add(action("整理转岗证据", "/pages/assistant/index", "CAREER_SWITCH", "HIGH"));
            actions.add(action("查看职业路线", "/pages/map/index", "LEARNING", "MEDIUM"));
        } else if ("internship_seeker".equals(identityType) && !selfReportedHasResume && resume == null) {
            stage = "INTERNSHIP_RESUME_BOOTSTRAP";
            headline = "建立第一版实习简历素材";
            focus = "先整理课程、项目和校园经历，形成可上传的实习简历草稿";
            reason = "你在 onboarding 中选择了找实习，且还没有可投递简历。今天应先把经历素材整理出来。";
            risks.add("实习简历素材尚未建立");
            riskKeys.add("agent.risk.reason.NO_RESUME");
            actions.add(action("整理实习简历素材", "/pages/resume/index", "RESUME", "HIGH"));
            actions.add(action("完成职业测评", "/pages/assessment/index", "ASSESSMENT", "MEDIUM"));
        } else if ("new_graduate".equals(identityType) && selfReportedHasResume && resume == null) {
            stage = "GRADUATE_RESUME_UPLOAD";
            headline = "上传简历并匹配一个目标 JD";
            focus = "用已有简历完成一次针对「" + targetRole + "」的 AI 诊断";
            reason = "你在 onboarding 中选择了应届/准应届且已有简历。下一步不是继续浏览功能，而是把简历上传并对齐目标岗位。";
            risks.add("已有简历尚未进入系统诊断");
            riskKeys.add("agent.risk.reason.NO_RESUME_HAS_ROLE");
            actions.add(action("上传简历做 JD 匹配", "/pages/resume/index", "RESUME", "HIGH"));
            actions.add(action("打开 AI 简历诊断", "/pages/resume-ai/index", "RESUME", "MEDIUM"));
        } else if (assessment == null) {
            stage = "ASSESSMENT_BASELINE";
            headline = "完成 5 分钟职业测评";
            focus = "为「" + targetRole + "」建立第一份能力和偏好基线";
            reason = "目标岗位已经明确，但还缺少测评画像。先补齐这个基线，后续简历和面试建议会更准。";
            risks.add("测评基线尚未建立");
            riskKeys.add("agent.risk.reason.NO_ASSESSMENT");
            actions.add(action("完成 5 分钟测评", "/pages/assessment/index", "ASSESSMENT", "HIGH"));
            actions.add(action("查看职业路线", "/pages/map/index", "LEARNING", "MEDIUM"));
        } else if (resume == null) {
            stage = "RESUME_BOOTSTRAP";
            headline = selfReportedHasResume ? "上传已有简历并做一次诊断" : "为「" + targetRole + "」准备一份简历";
            focus = selfReportedHasResume ? "把已有简历上传后匹配一个目标 JD" : "创建或上传你的第一份简历草稿";
            reason = selfReportedHasResume
                    ? "你自报已有简历，但系统还没有简历记录。先上传并诊断，准备度才会变成可评估状态。"
                    : "目标方向已明确，但在简历存在之前，我无法评估你的求职准备度。";
            risks.add("目标岗位暂无简历数据");
            riskKeys.add("agent.risk.reason.NO_RESUME");
            actions.add(action(selfReportedHasResume ? "上传简历做 JD 匹配" : "生成简历草稿", selfReportedHasResume ? "/pages/resume/index" : "/pages/resume-ai/index", "RESUME", "HIGH"));
            actions.add(action("打开简历模块", "/pages/resume/index", "RESUME", "MEDIUM"));
        } else if (resume.getDiagnosisScore() != null && resume.getDiagnosisScore() < RESUME_SCORE_THRESHOLD) {
            stage = "RESUME_IMPROVEMENT";
            headline = "投递前先优化你的简历";
            focus = "将简历诊断分数提升至 70 分以上";
            reason = "目标岗位明确，但当前简历分数偏低，可能影响面试邀约率。";
            risks.add("简历诊断分数低于推荐阈值");
            riskKeys.add("agent.risk.reason.RESUME_LOW_SCORE");
            actions.add(action("优化简历", "/pages/resume-ai/index", "RESUME", "HIGH"));
            actions.add(action("检查简历薄弱项", "/pages/assistant/index", "CHAT", "MEDIUM"));
        } else if (interview == null) {
            stage = "INTERVIEW_BOOTSTRAP";
            headline = "开始「" + targetRole + "」的面试练习";
            focus = "本周完成一次模拟面试";
            reason = "方向和简历已有足够信号。下一步风险是：你能否在面试压力下清晰表达经历。";
            risks.add("暂无模拟面试记录");
            riskKeys.add("agent.risk.reason.NO_INTERVIEW");
            actions.add(action("开始模拟面试", "/pages/interview/start", "INTERVIEW", "HIGH"));
            actions.add(action("用求职教练练习", "/pages/assistant/index", "CHAT", "MEDIUM"));
        } else if (interview.getLastScore() != null && interview.getLastScore() < INTERVIEW_SCORE_THRESHOLD) {
            stage = "INTERVIEW_IMPROVEMENT";
            headline = "针对薄弱维度专项练习";
            focus = "重点练习最薄弱的面试维度一次";
            reason = "面试分数低于就绪阈值，今天应专注针对性练习，而不是泛泛学习。";
            risks.add("上次面试分数低于推荐阈值");
            riskKeys.add("agent.risk.reason.INTERVIEW_LOW_SCORE");
            if (interview.getWeakDimensions() != null && !interview.getWeakDimensions().isEmpty()) {
                risks.add("薄弱维度：" + String.join("、", interview.getWeakDimensions()));
                riskKeys.add("agent.risk.reason.WEAK_DIMENSIONS");
            }
            actions.add(action("练习面试", "/pages/interview/start", "INTERVIEW", "HIGH"));
            actions.add(action("复盘面试回答", "/pages/assistant/index", "CHAT", "MEDIUM"));
        } else if (checkIn.getWeeklyDays() < MIN_CHECKIN_DAYS_PER_WEEK) {
            stage = "EXECUTION_RHYTHM";
            headline = "重建你的每周执行节奏";
            focus = "今天完成一项核心职业行动";
            reason = "你的档案可用，但近期行动连续性偏低。现在更适合先完成一个小任务，而不是继续增加计划。";
            risks.add("本周打卡天数不足 3 天");
            riskKeys.add("agent.risk.reason.LOW_CHECKIN");
            actions.add(action("查看打卡计划", "/pages/checkin/index", "CHECKIN", "HIGH"));
            actions.add(action("更新今日行动", "/pages/agent/index", "PLAN", "MEDIUM"));
        } else {
            stage = "CAREER_MOMENTUM";
            headline = "保持冲向「" + targetRole + "」的势头";
            focus = "完成一项专项提升任务并保持连续打卡";
            reason = "方向、简历和面试信号均已具备。最佳下一步是持续改进和跟踪进展。";
            actions.add(action("复盘求职计划", "/pages/assistant/index", "CHAT", "MEDIUM"));
            actions.add(action("打开求职路线", "/pages/map/index", "LEARNING", "MEDIUM"));
        }

        if (checkIn.getTodayCompleted() < checkIn.getTodayTotal()) {
            risks.add("今日核心任务尚未完成");
            riskKeys.add("agent.risk.reason.TODAY_INCOMPLETE");
        }
        Optional<UserCareerPlan> currentPlan = careerPlanService.getCurrent(userId);
        List<String> weeklyFocus = currentPlan.map(plan -> weeklyFocusItems(plan).stream().limit(2).toList()).orElseGet(List::of);
        if (!weeklyFocus.isEmpty()) {
            reason = reason + " 已找到你的长期规划，今日任务中已加入本周重点行动。";
            for (String item : weeklyFocus) {
                actions.add(planAction(item));
            }
        }
        syncTodayTasks(userId, focus, actions);
        agentStateService.refresh(userId, stage, null, targetRole, null);

        return CareerAgentTodayDto.builder()
                .stage(stage)
                .riskLevel(riskLevel(risks.size()))
                .headline(headline)
                .headlineKey("agent.today." + stage + ".headline")
                .reason(agentReasonService.reason(userId, stage, buildReasonContext(stage, targetRole, checkIn, user), personalize(reason, user, preferences)))
                .reasonKey("agent.today." + stage + ".reason")
                .todayFocus(focus)
                .focusKey("agent.today." + stage + ".focus")
                .progressPercent(progress)
                .riskReasons(risks)
                .riskReasonKeys(riskKeys)
                .actions(actions)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CareerAgentRiskDto getRiskWatch(Long userId) {
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        CheckInService.CheckInStatus checkIn = checkInService.getStatus(userId);
        LocalDate today = LocalDate.now();
        List<AgentTask> recentTasks = taskRepository.findByUserIdAndDueDateBetweenOrderByDueDateDescCreatedAtDesc(
                userId, today.minusDays(6), today);

        UserProfileSnapshot.AssessmentBlock assessment = snapshot.getAssessment();
        UserProfileSnapshot.ResumeBlock resume = snapshot.getResume();
        UserProfileSnapshot.InterviewBlock interview = snapshot.getInterview();
        UserProfileSnapshot.PreferencesBlock preferences = snapshot.getPreferences();
        String targetRole = firstText(
                preferences != null ? preferences.getTargetRole() : null,
                resume != null ? resume.getTargetJob() : null,
                interview != null ? interview.getPositionName() : null
        );

        List<CareerAgentRiskDto.RiskItem> risks = new ArrayList<>();
        risks.add(directionRisk(assessment, targetRole));
        risks.add(resumeRisk(resume, targetRole));
        risks.add(interviewRisk(interview));
        risks.add(executionRisk(checkIn, recentTasks));
        risks.add(profileRisk(assessment, resume, interview, targetRole));
        risks.sort(Comparator.comparing(CareerAgentRiskDto.RiskItem::getScore).reversed());

        CareerAgentRiskDto.RiskItem primary = risks.get(0);
        agentEventService.recordRiskChange(userId, primary.getCode(), primary.getLevel());
        return CareerAgentRiskDto.builder()
                .overallLevel(primary.getLevel())
                .primaryRiskCode(primary.getCode())
                .primaryRiskTitle(primary.getTitle())
                .summary(primary.getReason())
                .risks(risks)
                .build();
    }

    @Override
    public CareerAgentPlanDto getPlanSummary(Long userId) {
        Optional<UserCareerPlan> plan = careerPlanService.getCurrent(userId);
        return plan.map(this::toPlanDto).orElseGet(() -> CareerAgentPlanDto.builder()
                .hasPlan(false)
                .planHealth("MISSING")
                .adjustmentReason("尚未生成长期求职计划。")
                .weeklyFocus(List.of())
                .build());
    }

    @Override
    public CareerAgentPlanDto ensurePlan(Long userId) {
        Optional<UserCareerPlan> existing = careerPlanService.getCurrent(userId);
        if (existing.isPresent()) {
            return toPlanDto(existing.get());
        }
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        String targetRole = inferTargetRole(snapshot);
        return toPlanDto(careerPlanService.generate(userId, targetRole));
    }

    @Override
    @Transactional
    public List<AgentTask> getTodayTasks(Long userId) {
        getToday(userId);
        return taskRepository.findByUserIdAndDueDateOrderByCreatedAtDesc(userId, LocalDate.now());
    }

    @Override
    public List<AgentTask> getOpenTasks(Long userId) {
        return taskRepository.findByUserIdAndStatusOrderByDueDateAscCreatedAtDesc(userId, "TODO");
    }

    @Override
    @Transactional
    public AgentTask completeTask(Long userId, Long taskId) {
        AgentTask task = ownedTask(userId, taskId);
        task.setStatus("DONE");
        task.setCompletedAt(LocalDateTime.now());
        AgentTask saved = taskRepository.save(task);
        agentEventService.record(userId, "TASK_COMPLETED", "USER",
                Map.of("taskId", saved.getTaskId(), "taskKey", saved.getTaskKey(),
                        "title", saved.getTitle(), "taskType", saved.getTaskType()));
        return saved;
    }

    @Override
    @Transactional
    public AgentTask dismissTask(Long userId, Long taskId) {
        AgentTask task = ownedTask(userId, taskId);
        task.setStatus("DISMISSED");
        task.setCompletedAt(null);
        AgentTask saved = taskRepository.save(task);
        agentEventService.record(userId, "TASK_DISMISSED", "USER",
                Map.of("taskId", saved.getTaskId(), "taskKey", saved.getTaskKey(),
                        "title", saved.getTitle(), "taskType", saved.getTaskType()));
        return saved;
    }

    private void syncTodayTasks(Long userId, String focus, List<CareerAgentTodayDto.Action> actions) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);

        // Build dismissed-type map (type -> count) for last 7 days
        Map<String, Long> dismissedCounts = new java.util.HashMap<>();
        taskRepository.countDismissedByTaskTypeSince(userId, weekAgo, today)
                .forEach(row -> dismissedCounts.put((String) row[0], (Long) row[1]));

        // Compute 7-day completion rate
        long totalRecent = taskRepository.countAllSince(userId, weekAgo, today);
        long doneRecent = taskRepository.countDoneSince(userId, weekAgo, today);
        double completionRate = totalRecent > 0 ? (double) doneRecent / totalRecent : 0.5;

        // Limit daily task count for struggling users
        int taskLimit = completionRate < COMPLETION_RATE_LOW ? MAX_TASKS_LOW_COMPLETION : actions.size();
        int synced = 0;
        List<String> syncedKeys = new ArrayList<>();

        for (CareerAgentTodayDto.Action action : actions) {
            if (synced >= taskLimit) break;

            // Skip task types dismissed 2+ times this week (unless it's a plan weekly task)
            long dismissCount = dismissedCounts.getOrDefault(action.getType(), 0L);
            if (dismissCount >= DISMISS_SUPPRESS_THRESHOLD && !"PLAN_WEEKLY".equals(action.getSource())) continue;

            // For high-completion users, boost priority
            String priority = action.getPriority();
            if (completionRate >= COMPLETION_RATE_HIGH && "MEDIUM".equals(priority)) priority = "HIGH";

            String taskKey = taskKey(action);
            syncedKeys.add(taskKey);
            final String finalPriority = priority;
            taskRepository.findByUserIdAndDueDateAndTaskKey(userId, today, taskKey)
                    .map(existing -> {
                        if ("TODO".equals(existing.getStatus())) {
                            existing.setTitle(action.getLabel());
                            existing.setDescription(taskDescription(focus, action));
                            existing.setPriority(finalPriority);
                            existing.setTarget(action.getTarget());
                            existing.setSource(hasText(action.getSource()) ? action.getSource() : "DAILY_AGENT");
                            return taskRepository.save(existing);
                        }
                        return existing;
                    })
                    .orElseGet(() -> taskRepository.save(AgentTask.builder()
                            .userId(userId)
                            .taskKey(taskKey)
                            .title(action.getLabel())
                            .description(taskDescription(focus, action))
                            .taskType(action.getType())
                            .priority(finalPriority)
                            .status("TODO")
                            .target(action.getTarget())
                            .source(hasText(action.getSource()) ? action.getSource() : "DAILY_AGENT")
                            .dueDate(today)
                            .build()));
            synced++;
        }

        taskRepository.findByUserIdAndDueDateOrderByCreatedAtDesc(userId, today).stream()
                .filter(task -> "TODO".equals(task.getStatus()))
                .filter(task -> "DAILY_AGENT".equals(task.getSource()))
                .filter(task -> !syncedKeys.contains(task.getTaskKey()))
                .forEach(task -> {
                    task.setStatus("DISMISSED");
                    task.setCompletedAt(null);
                    taskRepository.save(task);
                });
    }

    private AgentTask ownedTask(Long userId, Long taskId) {
        AgentTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BizException("任务不存在或已失效"));
        if (!userId.equals(task.getUserId())) {
            throw new BizException("任务不存在或已失效");
        }
        return task;
    }

    private String taskKey(CareerAgentTodayDto.Action action) {
        String source = hasText(action.getSource()) ? action.getSource() : "DAILY_AGENT";
        String labelHash = Integer.toHexString(java.util.Objects.hash(action.getLabel(), action.getTarget()));
        return (source + ":" + action.getType() + ":" + labelHash)
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private String taskDescription(String focus, CareerAgentTodayDto.Action action) {
        if ("PLAN_WEEKLY".equals(action.getSource())) {
            return "来自长期求职计划的本周重点行动。";
        }
        return focus;
    }

    private CareerAgentTodayDto.Action planAction(String weeklyFocus) {
        return CareerAgentTodayDto.Action.builder()
                .label(shortTaskLabel(weeklyFocus))
                .target("/pages/map/index?tab=plan")
                .type("PLAN")
                .priority("HIGH")
                .source("PLAN_WEEKLY")
                .build();
    }

    private String shortTaskLabel(String text) {
        String value = text == null ? "" : text.trim();
        if (value.length() <= 24) return value;
        return value.substring(0, 24) + "…";
    }

    private List<String> weeklyFocusItems(UserCareerPlan plan) {
        JsonNode weeklyFocusJson = readJson(plan.getWeeklyFocusJson());
        List<String> weeklyFocus = new ArrayList<>();
        if (weeklyFocusJson.isArray()) {
            for (JsonNode item : weeklyFocusJson) {
                if (!item.asText("").isBlank()) weeklyFocus.add(item.asText());
            }
        }
        return weeklyFocus;
    }

    private CareerAgentPlanDto toPlanDto(UserCareerPlan plan) {
        JsonNode milestones = readJson(plan.getMilestonesJson());
        List<String> weeklyFocus = weeklyFocusItems(plan);
        JsonNode firstMilestone = milestones.isArray() && !milestones.isEmpty() ? milestones.get(0) : null;
        return CareerAgentPlanDto.builder()
                .hasPlan(true)
                .targetRole(plan.getTargetRole())
                .planHealth(planHealth(plan, weeklyFocus))
                .adjustmentReason(planAdjustmentReason(plan, weeklyFocus))
                .nextMilestoneHorizon(firstMilestone != null ? firstMilestone.path("horizon").asText("") : "")
                .nextMilestoneTitle(firstMilestone != null ? firstMilestone.path("title").asText("") : "")
                .weeklyFocus(weeklyFocus)
                .generatedAt(plan.getGeneratedAt() != null ? plan.getGeneratedAt().toString() : null)
                .lastUpdatedAt(plan.getLastUpdatedAt() != null ? plan.getLastUpdatedAt().toString() : null)
                .version(plan.getVersion())
                .build();
    }

    private JsonNode readJson(String raw) {
        try {
            if (raw == null || raw.isBlank()) return objectMapper.createArrayNode();
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            return objectMapper.createArrayNode();
        }
    }

    private String planHealth(UserCareerPlan plan, List<String> weeklyFocus) {
        if (plan.getLastUpdatedAt() == null) return "NEEDS_REFRESH";
        // Stale if not updated in 14 days
        if (plan.getLastUpdatedAt().isBefore(LocalDateTime.now().minusDays(14))) return "NEEDS_REFRESH";
        // Missing weekly focus means it cannot drive daily tasks
        if (weeklyFocus.isEmpty()) return "NEEDS_REFRESH";
        // Very old plan versions (before current app version baseline)
        if (plan.getVersion() != null && plan.getVersion() < 2) return "NEEDS_REFRESH";
        return "ON_TRACK";
    }

    private String planAdjustmentReason(UserCareerPlan plan, List<String> weeklyFocus) {
        if (plan.getLastUpdatedAt() == null) return "规划尚未生成，无法评估健康度。";
        if (plan.getLastUpdatedAt().isBefore(LocalDateTime.now().minusDays(14))) return "规划超过 14 天未更新，建议重新生成以对齐最新状态。";
        if (weeklyFocus.isEmpty()) return "本周重点缺失，今日任务无法与长期路径对齐。";
        if (plan.getVersion() != null && plan.getVersion() < 2) return "规划版本过旧，建议刷新以获得更准确的建议。";
        return "长期规划已就绪，今日行动可与其保持对齐。";
    }

    private String inferTargetRole(UserProfileSnapshot snapshot) {
        UserProfileSnapshot.ResumeBlock resume = snapshot.getResume();
        UserProfileSnapshot.InterviewBlock interview = snapshot.getInterview();
        UserProfileSnapshot.PreferencesBlock preferences = snapshot.getPreferences();
        return firstText(
                preferences != null ? preferences.getTargetRole() : null,
                resume != null ? resume.getTargetJob() : null,
                interview != null ? interview.getPositionName() : null,
                "互联网行业职位"
        );
    }

    private CareerAgentRiskDto.RiskItem directionRisk(UserProfileSnapshot.AssessmentBlock assessment, String targetRole) {
        int score = 0;
        if (!hasText(targetRole)) score += 45;
        if (assessment == null) score += 35;
        boolean ok = score == 0;
        String reason = ok ? "职业方向已有足够基线信号。" : "方向风险：" + (!hasText(targetRole) ? "目标岗位未设置" : "") + (assessment == null ? "，测评基线缺失" : "") + "。";
        String reasonKey = ok ? "agent.risk.reason.DIRECTION_OK" : (!hasText(targetRole) ? "agent.risk.reason.NO_TARGET_ROLE" : "agent.risk.reason.NO_ASSESSMENT");
        String rec = hasText(targetRole) ? "在提升执行力的同时保持目标岗位清晰。" : "完成测评并选择一个主要目标岗位。";
        String recKey = hasText(targetRole) ? "agent.risk.rec.DIRECTION_MAINTAIN" : "agent.risk.rec.DIRECTION_START";
        return risk("DIRECTION_RISK", "方向清晰度", score, score >= 60 ? "RISING" : "STABLE", reason, reasonKey, rec, recKey);
    }

    private CareerAgentRiskDto.RiskItem resumeRisk(UserProfileSnapshot.ResumeBlock resume, String targetRole) {
        int score = 0;
        String reason = "当前阶段简历准备度尚可。";
        String reasonKey = "agent.risk.reason.RESUME_OK";
        String rec = "保持简历与目标岗位对齐。";
        String recKey = "agent.risk.rec.RESUME_MAINTAIN";
        if (hasText(targetRole) && resume == null) {
            score = 70;
            reason = "已有目标方向但缺少简历，暂时无法评估简历可投递度。";
            reasonKey = "agent.risk.reason.NO_RESUME_HAS_ROLE";
            rec = "为「" + targetRole + "」创建或上传一份简历。";
            recKey = "agent.risk.rec.RESUME_CREATE";
        } else if (resume != null && resume.getDiagnosisScore() != null && resume.getDiagnosisScore() < RESUME_SCORE_THRESHOLD) {
            score = 65;
            reason = "简历诊断分数低于 70，申请材料可能影响面试邀约率。";
            reasonKey = "agent.risk.reason.RESUME_LOW_SCORE";
            rec = "优化项目描述和关键词后再增加投递。";
            recKey = "agent.risk.rec.RESUME_OPTIMIZE";
        } else if (resume == null) {
            score = 35;
            reason = "简历数据缺失，但目标方向尚不明确。";
            reasonKey = "agent.risk.reason.RESUME_NO_DATA";
            rec = "先设定目标岗位，再创建简历草稿。";
            recKey = "agent.risk.rec.RESUME_SET_ROLE";
        }
        return risk("RESUME_RISK", "简历准备度", score, score >= RESUME_SCORE_THRESHOLD - 5 ? "RISING" : "STABLE", reason, reasonKey, rec, recKey);
    }

    private CareerAgentRiskDto.RiskItem interviewRisk(UserProfileSnapshot.InterviewBlock interview) {
        int score = 25;
        String reason = "面试准备暂无紧迫负面信号。";
        String reasonKey = "agent.risk.reason.INTERVIEW_OK";
        String rec = "简历准备完善后保持定期练习。";
        String recKey = "agent.risk.rec.INTERVIEW_MAINTAIN";
        if (interview == null) {
            score = 55;
            reason = "尚无模拟面试记录，面试就绪度未知。";
            reasonKey = "agent.risk.reason.NO_INTERVIEW";
            rec = "完成一次模拟面试以暴露薄弱维度。";
            recKey = "agent.risk.rec.INTERVIEW_START";
        } else if (interview.getLastScore() != null && interview.getLastScore() < INTERVIEW_SCORE_THRESHOLD) {
            score = INTERVIEW_SCORE_THRESHOLD;
            reason = "上次面试分数低于 70";
            reasonKey = "agent.risk.reason.INTERVIEW_LOW_SCORE";
            if (interview.getWeakDimensions() != null && !interview.getWeakDimensions().isEmpty()) {
                reason += "，薄弱维度：" + String.join("、", interview.getWeakDimensions()) + "。";
            }
            rec = "针对最薄弱维度进行专项练习。";
            recKey = "agent.risk.rec.INTERVIEW_TARGETED";
        }
        return risk("INTERVIEW_RISK", "面试就绪度", score, score >= INTERVIEW_SCORE_THRESHOLD ? "RISING" : "STABLE", reason, reasonKey, rec, recKey);
    }

    private CareerAgentRiskDto.RiskItem executionRisk(CheckInService.CheckInStatus checkIn, List<AgentTask> recentTasks) {
        long total = recentTasks.size();
        long done = recentTasks.stream().filter(task -> "DONE".equals(task.getStatus())).count();
        long dismissed = recentTasks.stream().filter(task -> "DISMISSED".equals(task.getStatus())).count();
        int score = 0;
        if (checkIn.getWeeklyDays() < MIN_CHECKIN_DAYS_PER_WEEK) score += 35;
        if (total >= 3 && done == 0) score += 35;
        if (total > 0 && dismissed * 2 >= total) score += 20;
        if (checkIn.getTodayCompleted() < checkIn.getTodayTotal()) score += 10;
        String reason = score == 0
                ? "近期打卡和任务完成情况显示执行节奏稳定。"
                : "行动连续性偏低：本周活跃 " + checkIn.getWeeklyDays() + "/7 天，近期任务完成 " + done + "/" + total + "。";
        String reasonKey = score == 0 ? "agent.risk.reason.EXECUTION_OK" : "agent.risk.reason.EXECUTION_LOW";
        String trend = score >= 60 ? "RISING" : (done > 0 && checkIn.getWeeklyDays() >= 3 ? "DECREASING" : "STABLE");
        return risk("EXECUTION_RISK", "执行节奏", score, trend, reason, reasonKey, "今天先完成一个小任务，再增加新计划。", "agent.risk.rec.EXECUTION_ONE_TASK");
    }

    private CareerAgentRiskDto.RiskItem profileRisk(UserProfileSnapshot.AssessmentBlock assessment,
                                                    UserProfileSnapshot.ResumeBlock resume,
                                                    UserProfileSnapshot.InterviewBlock interview,
                                                    String targetRole) {
        int missing = 0;
        if (assessment == null) missing++;
        if (resume == null) missing++;
        if (interview == null) missing++;
        if (!hasText(targetRole)) missing++;
        int score = missing * 18;
        String reason = missing == 0
                ? "档案数据已足够支撑个性化推荐。"
                : "仍有 " + missing + " 项关键档案信号缺失，个性化程度受限。";
        String reasonKey = missing == 0 ? "agent.risk.reason.PROFILE_OK" : "agent.risk.reason.PROFILE_MISSING";
        return risk("PROFILE_RISK", "个性化质量", score, missing >= 3 ? "RISING" : "STABLE", reason, reasonKey, "通过测评、简历和面试模块补充缺失的档案信号。", "agent.risk.rec.PROFILE_FILL");
    }

    private CareerAgentRiskDto.RiskItem risk(String code, String title, int score, String trend,
            String reason, String reasonKey, String recommendation, String recommendationKey) {
        int normalized = Math.max(0, Math.min(100, score));
        return CareerAgentRiskDto.RiskItem.builder()
                .code(code)
                .title(title)
                .titleKey("agent.risk.title." + code)
                .level(riskLevelByScore(normalized))
                .trend(trend)
                .score(normalized)
                .reason(reason)
                .reasonKey(reasonKey)
                .recommendation(recommendation)
                .recommendationKey(recommendationKey)
                .build();
    }

    private String riskLevelByScore(int score) {
        if (score >= RISK_HIGH_THRESHOLD) return "HIGH";
        if (score >= RISK_MEDIUM_THRESHOLD) return "MEDIUM";
        return "LOW";
    }

    private int progress(UserProfileSnapshot.AssessmentBlock assessment,
                         UserProfileSnapshot.ResumeBlock resume,
                         UserProfileSnapshot.InterviewBlock interview,
                         String targetRole,
                         CheckInService.CheckInStatus checkIn) {
        int score = 0;
        if (assessment != null) score += 20;
        if (hasText(targetRole)) score += 20;
        if (resume != null) score += 25;
        if (interview != null) score += 25;
        if (checkIn.getWeeklyDays() >= 3) score += 10;
        return Math.min(score, 100);
    }

    private String riskLevel(int riskCount) {
        if (riskCount >= 3) return "HIGH";
        if (riskCount >= 1) return "MEDIUM";
        return "LOW";
    }

    private CareerAgentTodayDto.Action action(String label, String target, String type, String priority) {
        return CareerAgentTodayDto.Action.builder()
                .label(label)
                .labelKey("agent.action." + type)
                .target(target)
                .type(type)
                .priority(priority)
                .source("DAILY_AGENT")
                .build();
    }

    private String buildReasonContext(String stage, String targetRole, CheckInService.CheckInStatus checkIn, User user) {
        StringBuilder sb = new StringBuilder();
        if (hasText(targetRole)) sb.append("目标岗位：").append(targetRole).append("。");
        if (user != null && hasText(user.getMajor())) sb.append("专业：").append(user.getMajor()).append("。");
        if (checkIn != null) sb.append("本周打卡：").append(checkIn.getWeeklyDays()).append("/7 天。");
        sb.append("当前阶段：").append(stage).append("。");
        return sb.toString();
    }

    private String personalize(String reason, User user, UserProfileSnapshot.PreferencesBlock prefs) {
        List<String> hints = new ArrayList<>();
        if (user != null && hasText(user.getMajor())) hints.add("专业：" + user.getMajor());
        if (user != null && hasText(user.getSchool())) hints.add("学校：" + user.getSchool());
        if (hints.isEmpty()) return reason;
        return reason + "（" + String.join("，", hints) + "）";
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (hasText(value)) return value;
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
