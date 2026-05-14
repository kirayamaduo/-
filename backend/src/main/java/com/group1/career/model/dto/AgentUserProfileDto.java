package com.group1.career.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Phase E1: unified career profile exposed to the frontend.
 *
 * <p>This is what the agent "knows" about the user, plus what it does not yet
 * know (so we can ask for it). It powers the personalization indicator on the
 * home card and will become the single source of truth for today/risk/plan.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentUserProfileDto {

    private String personalizationLevel;
    private Integer completenessScore;
    private String currentStage;

    private TargetRole target;
    private Readiness readiness;
    private Behavior behavior;
    private List<SkillEntry> skills;

    /** Fields the agent still needs the user to provide. */
    private List<MissingSignal> missingSignals;

    /** Top risk code from the latest risk evaluation, for cross-section consistency. */
    private String primaryRiskCode;

    /** Where every fact came from, for explainability in the UI. */
    private Map<String, String> evidence;

    private String generatedAt;
    private String updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetRole {
        private String role;
        private String source;
        private BigDecimal confidence;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Readiness {
        private Integer overallPercent;
        private Integer resumeScore;
        private Integer interviewScore;
        private Boolean hasAssessment;
        private Boolean hasResume;
        private Boolean hasInterview;
        private Boolean hasPlan;
        private Integer directionClarityPercent;
        private Integer resumeReadinessPercent;
        private Integer interviewReadinessPercent;
        private Integer actionContinuityPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Behavior {
        private Integer streakDays;
        private Integer weeklyDays;
        private Integer todayCompleted;
        private Integer todayTotal;
        private BigDecimal completionRate7d;
        private BigDecimal dismissRate7d;
        private String preferredDifficulty;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillEntry {
        private String name;
        private String category;
        private Integer level;
        private String source;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MissingSignal {
        /** Stable identifier, e.g. {@code target_city}, {@code weekly_hours}. */
        private String key;
        /** Human-readable label for the UI prompt. */
        private String label;
        /** HIGH | MEDIUM | LOW — used to prioritize what we ask first. */
        private String priority;
    }
}
