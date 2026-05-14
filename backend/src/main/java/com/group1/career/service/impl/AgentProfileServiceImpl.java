package com.group1.career.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.model.dto.AgentUserProfileDto;
import com.group1.career.model.dto.ProfileInputsRequest;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.entity.AgentTask;
import com.group1.career.model.entity.AgentUserProfile;
import com.group1.career.model.entity.UserCareerPlan;
import com.group1.career.model.entity.UserFact;
import com.group1.career.repository.AgentTaskRepository;
import com.group1.career.repository.AgentUserProfileRepository;
import com.group1.career.repository.UserFactRepository;
import com.group1.career.service.AgentProfileService;
import com.group1.career.service.CareerPlanService;
import com.group1.career.service.CheckInService;
import com.group1.career.service.UserProfileSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentProfileServiceImpl implements AgentProfileService {

    private final AgentUserProfileRepository profileRepository;
    private final UserProfileSnapshotService snapshotService;
    private final CheckInService checkInService;
    private final CareerPlanService careerPlanService;
    private final AgentTaskRepository taskRepository;
    private final UserFactRepository userFactRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public AgentUserProfileDto getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(this::toDto)
                .orElseGet(() -> refresh(userId));
    }

    @Override
    @Transactional
    public AgentUserProfileDto refresh(Long userId) {
        UserProfileSnapshot snapshot = snapshotService.read(userId);
        CheckInService.CheckInStatus checkIn = checkInService.getStatus(userId);
        Optional<UserCareerPlan> plan = careerPlanService.getCurrent(userId);
        List<UserFact> facts = userFactRepository.findByUserId(userId);
        List<AgentTask> recentTasks = taskRepository.findByUserIdAndDueDateBetweenOrderByDueDateDescCreatedAtDesc(
                userId, LocalDate.now().minusDays(6), LocalDate.now());

        UserProfileSnapshot.AssessmentBlock assessment = snapshot.getAssessment();
        UserProfileSnapshot.ResumeBlock resume = snapshot.getResume();
        UserProfileSnapshot.InterviewBlock interview = snapshot.getInterview();
        UserProfileSnapshot.PreferencesBlock prefs = snapshot.getPreferences();
        UserProfileSnapshot.OnboardingBlock onboarding = snapshot.getOnboarding();

        // ── target role ──────────────────────────────────────────────────────
        String targetRole = null;
        String targetSource = null;
        BigDecimal targetConfidence = BigDecimal.ZERO;
        Map<String, String> evidence = new LinkedHashMap<>();

        if (prefs != null && hasText(prefs.getTargetRole())) {
            targetRole = prefs.getTargetRole();
            targetSource = "PREFERENCES";
            targetConfidence = new BigDecimal("0.90");
            evidence.put("target_role", "from user preferences");
        } else if (resume != null && hasText(resume.getTargetJob())) {
            targetRole = resume.getTargetJob();
            targetSource = "RESUME";
            targetConfidence = new BigDecimal("0.75");
            evidence.put("target_role", "from resume target job");
        } else if (interview != null && hasText(interview.getPositionName())) {
            targetRole = interview.getPositionName();
            targetSource = "INTERVIEW";
            targetConfidence = new BigDecimal("0.60");
            evidence.put("target_role", "from interview position");
        } else {
            Optional<UserFact> factRole = facts.stream()
                    .filter(f -> "target_role".equals(f.getFactKey()))
                    .findFirst();
            if (factRole.isPresent()) {
                targetRole = factRole.get().getFactValue();
                targetSource = "USER_INPUT";
                targetConfidence = factRole.get().getConfidence();
                evidence.put("target_role", "from user stated fact");
            } else if (assessment != null && assessment.getSuggestedRoles() != null
                    && !assessment.getSuggestedRoles().isEmpty()) {
                targetRole = assessment.getSuggestedRoles().get(0);
                targetSource = "INFERRED";
                targetConfidence = new BigDecimal("0.45");
                evidence.put("target_role", "inferred from assessment suggested roles");
            }
        }

        // ── readiness ────────────────────────────────────────────────────────
        boolean hasAssessment = assessment != null;
        boolean hasResume = resume != null;
        boolean hasInterview = interview != null;
        boolean hasPlan = plan.isPresent();
        int resumeScore = (resume != null && resume.getDiagnosisScore() != null) ? resume.getDiagnosisScore() : 0;
        int interviewScore = (interview != null && interview.getLastScore() != null) ? interview.getLastScore() : 0;

        int readinessBase = 0;
        if (hasAssessment) readinessBase += 20;
        if (hasResume) readinessBase += 25;
        if (resumeScore >= 70) readinessBase += 10;
        if (hasInterview) readinessBase += 25;
        if (interviewScore >= 70) readinessBase += 10;
        if (hasPlan) readinessBase += 10;
        int overallReadiness = Math.min(readinessBase, 100);
        int directionClarity = Math.min(100, (hasText(targetRole) ? 60 : 0) + (hasAssessment ? 40 : 0));
        int resumeReadiness = hasResume
                ? Math.min(100, 55 + (resumeScore > 0 ? Math.min(45, resumeScore / 2) : 0))
                : ("yes".equalsIgnoreCase(onboarding != null ? onboarding.getHasResume() : null) ? 25 : 0);
        int interviewReadiness = hasInterview
                ? Math.min(100, 50 + (interviewScore > 0 ? Math.min(50, interviewScore / 2) : 0))
                : 0;
        int actionContinuity = Math.min(100, checkIn.getWeeklyDays() * 25
                + (checkIn.getTodayCompleted() > 0 ? 25 : 0));

        AgentUserProfileDto.Readiness readiness = AgentUserProfileDto.Readiness.builder()
                .overallPercent(overallReadiness)
                .resumeScore(resumeScore)
                .interviewScore(interviewScore)
                .hasAssessment(hasAssessment)
                .hasResume(hasResume)
                .hasInterview(hasInterview)
                .hasPlan(hasPlan)
                .directionClarityPercent(directionClarity)
                .resumeReadinessPercent(resumeReadiness)
                .interviewReadinessPercent(interviewReadiness)
                .actionContinuityPercent(actionContinuity)
                .build();

        // ── behavior ─────────────────────────────────────────────────────────
        int total7d = recentTasks.size();
        long done7d = recentTasks.stream().filter(t -> "DONE".equals(t.getStatus())).count();
        long dismissed7d = recentTasks.stream().filter(t -> "DISMISSED".equals(t.getStatus())).count();
        BigDecimal completionRate = total7d > 0
                ? BigDecimal.valueOf(done7d).divide(BigDecimal.valueOf(total7d), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal dismissRate = total7d > 0
                ? BigDecimal.valueOf(dismissed7d).divide(BigDecimal.valueOf(total7d), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        String preferredDifficulty = "MEDIUM";
        Optional<UserFact> diffFact = facts.stream()
                .filter(f -> "preferred_task_difficulty".equals(f.getFactKey())).findFirst();
        if (diffFact.isPresent()) preferredDifficulty = diffFact.get().getFactValue();

        AgentUserProfileDto.Behavior behavior = AgentUserProfileDto.Behavior.builder()
                .streakDays(checkIn.getStreakDays())
                .weeklyDays(checkIn.getWeeklyDays())
                .todayCompleted(checkIn.getTodayCompleted())
                .todayTotal(checkIn.getTodayTotal())
                .completionRate7d(completionRate)
                .dismissRate7d(dismissRate)
                .preferredDifficulty(preferredDifficulty)
                .build();

        // ── skills from user_facts ────────────────────────────────────────────
        List<AgentUserProfileDto.SkillEntry> skills = facts.stream()
                .filter(f -> "SKILL".equals(f.getCategory()))
                .map(f -> AgentUserProfileDto.SkillEntry.builder()
                        .name(f.getFactKey().replace("skill_", ""))
                        .category("SKILL")
                        .level(parseLevel(f.getFactValue()))
                        .source(f.getSource())
                        .build())
                .collect(Collectors.toList());
        if (!skills.isEmpty()) evidence.put("skills", "from AI-extracted user facts");

        // ── missing signals ───────────────────────────────────────────────────
        List<AgentUserProfileDto.MissingSignal> missing = new ArrayList<>();
        if (!hasText(targetRole)) {
            missing.add(signal("target_role", "目标岗位", "HIGH"));
        }
        if (!hasAssessment) {
            missing.add(signal("assessment", "完成一次职业测评", "HIGH"));
        }
        if (!hasResume) {
            String label = "yes".equalsIgnoreCase(onboarding != null ? onboarding.getHasResume() : null)
                    ? "上传已有简历"
                    : "上传或创建简历";
            missing.add(signal("resume", label, "HIGH"));
        }
        if (!hasInterview) {
            missing.add(signal("interview", "完成一次模拟面试", "MEDIUM"));
        }
        if (facts.stream().noneMatch(f -> "target_city".equals(f.getFactKey()))) {
            missing.add(signal("target_city", "期望工作城市", "MEDIUM"));
        }
        if (facts.stream().noneMatch(f -> "weekly_hours".equals(f.getFactKey()))) {
            missing.add(signal("weekly_hours", "每周可投入时间", "LOW"));
        }
        if (!hasPlan) {
            missing.add(signal("career_plan", "生成长期职业计划", "MEDIUM"));
        }

        // ── completeness & level ──────────────────────────────────────────────
        int completeness = computeCompleteness(hasAssessment, hasResume, resumeScore,
                hasInterview, interviewScore, hasPlan, targetRole, skills, missing,
                checkIn, facts);
        String level = completeness >= 70 ? "HIGH" : completeness >= 40 ? "MEDIUM" : "LOW";

        // ── stage (fast heuristic, mirrors getToday logic) ───────────────────
        String stage = inferStage(targetRole, assessment, resume, interview, checkIn, onboarding);

        // ── persist ───────────────────────────────────────────────────────────
        AgentUserProfile entity = profileRepository.findByUserId(userId)
                .orElseGet(() -> AgentUserProfile.builder().userId(userId).build());

        entity.setPersonalizationLevel(level);
        entity.setCompletenessScore(completeness);
        entity.setCurrentStage(stage);
        entity.setTargetRole(targetRole);
        entity.setTargetRoleSource(targetSource);
        entity.setTargetRoleConfidence(targetConfidence);
        entity.setReadinessJson(toJson(readiness));
        entity.setSkillProfileJson(toJson(skills));
        entity.setBehaviorProfileJson(toJson(behavior));
        entity.setMissingSignalsJson(toJson(missing));
        entity.setEvidenceJson(toJson(evidence));
        profileRepository.save(entity);

        return AgentUserProfileDto.builder()
                .personalizationLevel(level)
                .completenessScore(completeness)
                .currentStage(stage)
                .target(AgentUserProfileDto.TargetRole.builder()
                        .role(targetRole)
                        .source(targetSource)
                        .confidence(targetConfidence)
                        .build())
                .readiness(readiness)
                .behavior(behavior)
                .skills(skills)
                .missingSignals(missing)
                .evidence(evidence)
                .generatedAt(entity.getGeneratedAt() != null ? entity.getGeneratedAt().toString() : LocalDateTime.now().toString())
                .updatedAt(LocalDateTime.now().toString())
                .build();
    }

    @Override
    @Transactional
    public AgentUserProfileDto saveInputs(Long userId, ProfileInputsRequest req) {
        upsertFact(userId, "PREFERENCE", "target_city",               req.getTargetCity());
        upsertFact(userId, "PREFERENCE", "target_industry",           req.getTargetIndustry());
        upsertFact(userId, "PREFERENCE", "timeline",                  req.getTimeline());
        upsertFact(userId, "PREFERENCE", "weekly_hours",              req.getWeeklyHours());
        upsertFact(userId, "PREFERENCE", "preferred_task_difficulty", req.getPreferredDifficulty());
        if (req.getConsiderGradSchool() != null) {
            upsertFact(userId, "PREFERENCE", "consider_grad_school",
                    req.getConsiderGradSchool() ? "true" : "false");
        }
        if (req.getConsiderStudyAbroad() != null) {
            upsertFact(userId, "PREFERENCE", "consider_study_abroad",
                    req.getConsiderStudyAbroad() ? "true" : "false");
        }
        upsertFact(userId, "CAREER_GOAL", "career_goal_note", req.getCareerGoalNote());
        return refresh(userId);
    }

    private void upsertFact(Long userId, String category, String key, String value) {
        if (value == null || value.isBlank()) return;
        UserFact fact = userFactRepository.findByUserIdAndFactKey(userId, key)
                .orElseGet(() -> UserFact.builder()
                        .userId(userId).category(category).factKey(key).build());
        fact.setCategory(category);
        fact.setFactValue(value.trim());
        fact.setConfidence(BigDecimal.ONE);
        fact.setSource("USER_INPUT");
        userFactRepository.save(fact);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private int computeCompleteness(boolean hasAssessment, boolean hasResume, int resumeScore,
                                     boolean hasInterview, int interviewScore, boolean hasPlan,
                                     String targetRole, List<AgentUserProfileDto.SkillEntry> skills,
                                     List<AgentUserProfileDto.MissingSignal> missing,
                                     CheckInService.CheckInStatus checkIn, List<UserFact> facts) {
        int score = 0;
        if (hasText(targetRole)) score += 20;
        if (hasAssessment) score += 15;
        if (hasResume) score += 15;
        if (resumeScore >= 60) score += 10;
        if (hasInterview) score += 15;
        if (interviewScore >= 60) score += 5;
        if (hasPlan) score += 10;
        if (checkIn.getStreakDays() >= 3) score += 5;
        if (facts.stream().anyMatch(f -> "target_city".equals(f.getFactKey()))) score += 3;
        if (facts.stream().anyMatch(f -> "weekly_hours".equals(f.getFactKey()))) score += 2;
        return Math.min(score, 100);
    }

    private String inferStage(String targetRole, UserProfileSnapshot.AssessmentBlock assessment,
                               UserProfileSnapshot.ResumeBlock resume,
                               UserProfileSnapshot.InterviewBlock interview,
                               CheckInService.CheckInStatus checkIn,
                               UserProfileSnapshot.OnboardingBlock onboarding) {
        if (!hasText(targetRole)) return "TARGET_ROLE_SELECTION";
        String identityType = onboarding != null ? onboarding.getIdentityType() : null;
        String selfReportedResume = onboarding != null ? onboarding.getHasResume() : null;
        if ("career_switcher".equals(identityType)) return "CAREER_SWITCH_POSITIONING";
        if ("internship_seeker".equals(identityType) && !"yes".equalsIgnoreCase(selfReportedResume) && resume == null) {
            return "INTERNSHIP_RESUME_BOOTSTRAP";
        }
        if ("new_graduate".equals(identityType) && "yes".equalsIgnoreCase(selfReportedResume) && resume == null) {
            return "GRADUATE_RESUME_UPLOAD";
        }
        if (assessment == null) return "ASSESSMENT_BASELINE";
        if (resume == null) return "RESUME_BOOTSTRAP";
        if (resume.getDiagnosisScore() != null && resume.getDiagnosisScore() < 70) return "RESUME_IMPROVEMENT";
        if (interview == null) return "INTERVIEW_BOOTSTRAP";
        if (interview.getLastScore() != null && interview.getLastScore() < 70) return "INTERVIEW_IMPROVEMENT";
        if (checkIn.getWeeklyDays() < 3) return "EXECUTION_RHYTHM";
        return "CAREER_MOMENTUM";
    }

    private AgentUserProfileDto.MissingSignal signal(String key, String label, String priority) {
        return AgentUserProfileDto.MissingSignal.builder()
                .key(key).label(label).priority(priority).build();
    }

    private AgentUserProfileDto toDto(AgentUserProfile e) {
        return AgentUserProfileDto.builder()
                .personalizationLevel(e.getPersonalizationLevel())
                .completenessScore(e.getCompletenessScore())
                .currentStage(e.getCurrentStage())
                .target(AgentUserProfileDto.TargetRole.builder()
                        .role(e.getTargetRole())
                        .source(e.getTargetRoleSource())
                        .confidence(e.getTargetRoleConfidence())
                        .build())
                .readiness(fromJson(e.getReadinessJson(), AgentUserProfileDto.Readiness.class))
                .behavior(fromJson(e.getBehaviorProfileJson(), AgentUserProfileDto.Behavior.class))
                .skills(fromJsonList(e.getSkillProfileJson(), AgentUserProfileDto.SkillEntry.class))
                .missingSignals(fromJsonList(e.getMissingSignalsJson(), AgentUserProfileDto.MissingSignal.class))
                .evidence(fromJsonMap(e.getEvidenceJson()))
                .generatedAt(e.getGeneratedAt() != null ? e.getGeneratedAt().toString() : null)
                .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null)
                .build();
    }

    private Integer parseLevel(String value) {
        try { return Integer.parseInt(value.trim()); } catch (Exception e) { return 50; }
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); } catch (Exception e) { return "null"; }
    }

    private <T> T fromJson(String json, Class<T> type) {
        if (json == null || json.isBlank() || "null".equals(json)) return null;
        try { return objectMapper.readValue(json, type); } catch (Exception e) { return null; }
    }

    private Map<String, String> fromJsonMap(String json) {
        if (json == null || json.isBlank() || "null".equals(json)) return Map.of();
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, String.class));
        } catch (Exception e) { return Map.of(); }
    }

    private <T> List<T> fromJsonList(String json, Class<T> elementType) {
        if (json == null || json.isBlank() || "null".equals(json)) return List.of();
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, elementType));
        } catch (Exception e) { return List.of(); }
    }

    private boolean hasText(String s) { return s != null && !s.isBlank(); }

    @Override
    @Transactional(readOnly = true)
    public String renderForPrompt(Long userId) {
        AgentUserProfile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) return "";

        List<String> lines = new ArrayList<>();
        lines.add("[CAREER AGENT PROFILE — use this as the primary source of truth about the user]");

        if (hasText(profile.getTargetRole())) {
            String src = profile.getTargetRoleSource() != null ? " (source: " + profile.getTargetRoleSource() + ")" : "";
            String conf = profile.getTargetRoleConfidence() != null
                    ? ", confidence " + profile.getTargetRoleConfidence().multiply(java.math.BigDecimal.valueOf(100)).intValue() + "%"
                    : "";
            lines.add("- Target role: " + profile.getTargetRole() + src + conf);
        }

        lines.add("- Personalization: " + profile.getPersonalizationLevel()
                + " (" + profile.getCompletenessScore() + "% completeness)");

        if (hasText(profile.getCurrentStage())) {
            lines.add("- Current career stage: " + profile.getCurrentStage());
        }

        if (hasText(profile.getPrimaryRiskCode())) {
            lines.add("- Primary risk area: " + profile.getPrimaryRiskCode());
        }

        String readiness = profile.getReadinessJson();
        if (hasText(readiness)) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> r = objectMapper.readValue(readiness, Map.class);
                StringBuilder rb = new StringBuilder("- Readiness scores:");
                r.forEach((k, v) -> rb.append(" ").append(k).append("=").append(v));
                lines.add(rb.toString());
            } catch (Exception ignored) {}
        }

        String missingJson = profile.getMissingSignalsJson();
        if (hasText(missingJson)) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, String>> signals = objectMapper.readValue(missingJson, List.class);
                if (!signals.isEmpty()) {
                    String missing = signals.stream()
                            .map(s -> s.get("label"))
                            .filter(java.util.Objects::nonNull)
                            .collect(java.util.stream.Collectors.joining(", "));
                    if (!missing.isBlank()) {
                        lines.add("- Missing info (ask user if relevant): " + missing);
                    }
                }
            } catch (Exception ignored) {}
        }

        return String.join("\n", lines);
    }
}
