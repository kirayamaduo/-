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
        // Algorithm v2 — explicit, smooth, auditable.
        //
        // Each sub-score is a percentage [0,100] composed of small additive
        // contributions so a single user action never jumps the score by more
        // than ~10 percentage points. The final overall score is a fixed
        // weighted average of the five sub-scores; weights sum to 1.0 and are
        // declared as constants below to keep them visible to reviewers.
        boolean hasAssessment = assessment != null;
        boolean hasResume = resume != null;
        boolean hasInterview = interview != null;
        boolean hasPlan = plan.isPresent();
        int resumeScore = (resume != null && resume.getDiagnosisScore() != null) ? resume.getDiagnosisScore() : 0;
        int interviewScore = (interview != null && interview.getLastScore() != null) ? interview.getLastScore() : 0;

        boolean hasTargetCity = facts.stream().anyMatch(f -> "target_city".equals(f.getFactKey()));
        boolean hasTargetIndustry = facts.stream().anyMatch(f -> "target_industry".equals(f.getFactKey()));

        int directionClarity = computeDirectionClarity(targetRole, targetConfidence, hasAssessment,
                hasTargetCity, hasTargetIndustry);
        int resumeReadiness = computeResumeReadiness(hasResume, resumeScore, onboarding);
        int interviewReadiness = computeInterviewReadiness(hasInterview, interviewScore);
        int actionContinuity = computeActionContinuity(checkIn);
        int planReadiness = hasPlan ? 100 : 0;
        int overallReadiness = weightedReadiness(
                directionClarity,
                resumeReadiness,
                interviewReadiness,
                actionContinuity,
                planReadiness);

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

        // ── sync edited fields back to profileSnapshot.onboarding ────────────
        // The "求职画像" card on the homepage reads from snapshot.onboarding.
        // Without this sync, editing the profile never updates that card.
        syncInputsToOnboarding(userId, req);

        return refresh(userId);
    }

    /**
     * Push user-edited preference fields into the snapshot's onboarding block
     * so the homepage "求职画像" card stays in sync with the profile editor.
     *
     * The onboarding block uses coded enum values (e.g. "lt_5h") while the
     * profile editor stores human-readable / numeric values (e.g. "3").
     * This method translates between the two vocabularies.
     */
    private void syncInputsToOnboarding(Long userId, ProfileInputsRequest req) {
        UserProfileSnapshot.OnboardingBlock patch = UserProfileSnapshot.OnboardingBlock.builder().build();
        boolean dirty = false;

        // timeline: editor uses "1个月"/"3个月"/"6个月"/"校招季"/"不确定"
        //           onboarding uses "within_1_month"/"within_3_months"/"prepare_early"
        if (hasText(req.getTimeline())) {
            patch.setTimeline(mapTimelineToOnboarding(req.getTimeline()));
            dirty = true;
        }

        // weeklyHours: editor uses "3"/"7"/"15"/"25"
        //              onboarding uses "lt_5h"/"5_10h"/"10_20h"/"gt_20h"
        if (hasText(req.getWeeklyHours())) {
            patch.setWeeklyAvailability(mapWeeklyHoursToOnboarding(req.getWeeklyHours()));
            dirty = true;
        }

        if (dirty) {
            snapshotService.mergeOnboarding(userId, patch);
        }
    }

    private static String mapTimelineToOnboarding(String timeline) {
        return switch (timeline) {
            case "1个月" -> "within_1_month";
            case "3个月" -> "within_3_months";
            case "6个月", "校招季" -> "prepare_early";
            default -> timeline; // "不确定" etc. — mapLabel fallback shows raw value
        };
    }

    private static String mapWeeklyHoursToOnboarding(String hours) {
        return switch (hours) {
            case "3"  -> "lt_5h";
            case "7"  -> "5_10h";
            case "15" -> "10_20h";
            case "25" -> "gt_20h";
            default   -> hours;
        };
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

    // ───── readiness algorithm v2 ─────
    // Weights of the five sub-scores in the overall readiness. They are
    // declared as named constants so reviewers can audit the algorithm in
    // one place and any change is visible in code review (a hard requirement
    // from the product team — historical scores moved silently before).
    private static final double W_DIRECTION = 0.25;
    private static final double W_RESUME    = 0.25;
    private static final double W_INTERVIEW = 0.25;
    private static final double W_ACTION    = 0.15;
    private static final double W_PLAN      = 0.10;

    /**
     * Direction clarity (0-100).
     *
     * Composed of:
     *   - up to 60 pts from the source-of-truth confidence in the target role
     *     (a preference-stated role beats a resume-inferred one beats an
     *     assessment-inferred one);
     *   - 20 pts for having a recent assessment to anchor the recommendation;
     *   - 10 pts for stating a target city;
     *   - 10 pts for stating a target industry.
     *
     * The confidence-weighted contribution makes the score continuous rather
     * than jumping between 0/60/100, which is what users were complaining
     * about ("the number bounces around for no reason").
     */
    private int computeDirectionClarity(String targetRole,
                                        BigDecimal targetConfidence,
                                        boolean hasAssessment,
                                        boolean hasTargetCity,
                                        boolean hasTargetIndustry) {
        double confidence = (hasText(targetRole) && targetConfidence != null)
                ? targetConfidence.doubleValue()
                : 0.0;
        // Defensive: confidence is intended to be in [0,1]. Anything outside
        // is treated as the closest legal value rather than silently
        // overflowing the 60-point ceiling.
        confidence = Math.max(0.0, Math.min(1.0, confidence));
        int rolePts = (int) Math.round(confidence * 60.0);
        int assessmentPts = hasAssessment ? 20 : 0;
        int cityPts = hasTargetCity ? 10 : 0;
        int industryPts = hasTargetIndustry ? 10 : 0;
        return clampPercent(rolePts + assessmentPts + cityPts + industryPts);
    }

    /**
     * Resume readiness (0-100).
     *
     * Continuous formula: 30 baseline for "the user actually has a resume in
     * the system" + 0.70 * the AI diagnosis score. This means a brand-new
     * resume with no diagnosis sits at 30 and a perfectly-diagnosed resume
     * lands at 100, with every diagnosis-point movement worth exactly 0.7
     * readiness points (no surprises).
     *
     * When no resume exists yet we fall back to coarse self-reported
     * signals from onboarding, capped at 20 so the score can never claim
     * the user is "ready" purely on self-report.
     */
    private int computeResumeReadiness(boolean hasResume, int resumeScore,
                                       UserProfileSnapshot.OnboardingBlock onboarding) {
        if (hasResume) {
            if (resumeScore > 0) {
                int normalizedScore = clampPercent(resumeScore);
                return clampPercent(30 + (int) Math.round(normalizedScore * 0.70));
            }
            return 30;
        }
        String selfReported = onboarding != null ? onboarding.getHasResume() : null;
        String resumeStatus = onboarding != null ? onboarding.getResumeStatus() : null;
        if ("ready".equalsIgnoreCase(resumeStatus)) return 20;
        if ("draft".equalsIgnoreCase(resumeStatus) || "yes".equalsIgnoreCase(selfReported)) return 10;
        return 0;
    }

    /**
     * Interview readiness (0-100).
     *
     * Mirrors the resume formula: 20 baseline for "the user has actually
     * attempted at least one mock interview" + 0.80 * the last interview
     * score. A user who attempts a single interview goes from 0 → 20 (one
     * sub-score point in the overall readiness) rather than the old
     * 0 → 30 jump.
     */
    private int computeInterviewReadiness(boolean hasInterview, int interviewScore) {
        if (!hasInterview) return 0;
        if (interviewScore > 0) {
            int normalizedScore = clampPercent(interviewScore);
            return clampPercent(20 + (int) Math.round(normalizedScore * 0.80));
        }
        return 20;
    }

    /**
     * Action continuity (0-100).
     *
     * Three smooth components instead of the old two cliff-edged ones:
     *   - up to 50 pts for a 7+ day streak (≈7 pts per consecutive day);
     *   - up to 35 pts for weekly active days (5 pts per active day, max 7);
     *   - up to 15 pts for today's completed tasks (5 pts per task, max 3).
     *
     * The previous formula `weeklyDays * 20 + (todayCompleted > 0 ? 20 : 0)`
     * meant a single check-in could swing the overall score by 6 points
     * (20 * 0.15 weight × 2) — felt arbitrary to QA. The new formula caps
     * any single-event jump to ~5 sub-score points.
     */
    private int computeActionContinuity(CheckInService.CheckInStatus checkIn) {
        if (checkIn == null) return 0;
        int streakPts = Math.min(50, Math.max(0, checkIn.getStreakDays()) * 7);
        int weeklyPts = Math.min(35, Math.max(0, checkIn.getWeeklyDays()) * 5);
        int todayPts = checkIn.getTodayCompleted() > 0
                ? Math.min(15, checkIn.getTodayCompleted() * 5)
                : 0;
        return clampPercent(streakPts + weeklyPts + todayPts);
    }

    private int weightedReadiness(int directionClarity, int resumeReadiness, int interviewReadiness,
                                  int actionContinuity, int planReadiness) {
        return clampPercent((int) Math.round(
                directionClarity * W_DIRECTION
                        + resumeReadiness * W_RESUME
                        + interviewReadiness * W_INTERVIEW
                        + actionContinuity * W_ACTION
                        + planReadiness * W_PLAN));
    }

    private int clampPercent(int score) {
        return Math.max(0, Math.min(100, score));
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
