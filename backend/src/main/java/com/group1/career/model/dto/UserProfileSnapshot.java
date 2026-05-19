package com.group1.career.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cross-tool user portrait. Serialised as JSON into {@code users.profile_snapshot}
 * and merged section-by-section as the user touches different parts of the app.
 *
 * <p>Design notes:
 * <ul>
 *   <li>Every block is independent — a user who only uploads a resume gets
 *       {@code resume} populated and the others stay null. Tools should
 *       tolerate any block being absent.</li>
 *   <li>{@code @JsonInclude(NON_NULL)} keeps the persisted JSON small so we
 *       can ship it as part of the AI assistant's system prompt without
 *       blowing the token budget.</li>
 *   <li>Bumping {@link #version} tells future readers when an old payload
 *       needs migrating in code.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileSnapshot {

    /** Schema version. Bump when adding a non-backwards-compatible field. */
    @Builder.Default
    private Integer version = 1;

    /** Last time any block in this snapshot was touched. */
    private LocalDateTime updatedAt;

    private AssessmentBlock assessment;
    private ResumeBlock resume;
    private InterviewBlock interview;
    private PreferencesBlock preferences;
    private OnboardingBlock onboarding;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AssessmentBlock {
        private Long lastRecordId;
        private Long scaleId;
        private String scaleTitle;
        /** Personality code, e.g. {@code "ENFP"} for MBTI or {@code "RIA"} for Holland. */
        private String summary;
        /** AI-suggested job titles cached from the last result, e.g. {@code ["Frontend Engineer", "UX Designer"]}. */
        private List<String> suggestedRoles;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResumeBlock {
        private Long lastResumeId;
        /** OSS object key, never a URL — so it stays valid across bucket / endpoint changes. */
        private String lastResumeKey;
        private String title;
        private String targetJob;
        private Integer diagnosisScore;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class InterviewBlock {
        private Long lastInterviewId;
        private String positionName;
        private String difficulty;
        private Integer lastScore;
        /** Dimension names where the user under-performed, e.g. {@code ["communication"]}. */
        private List<String> weakDimensions;
        /** Dimension names where the user shone, e.g. {@code ["technical depth"]}. */
        private List<String> strongDimensions;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PreferencesBlock {
        /** The role string the user has shown interest in (assessment-suggested or interview-target). */
        private String targetRole;
        /** Last interview mode they picked, {@code "voice"} or {@code "text"}. */
        private String interviewMode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OnboardingBlock {
        /** User self-selected career status: student, new_graduate, internship_seeker, career_switcher. */
        private String identityType;
        /** Same signal as identityType, kept as a product-facing name for the Chinese onboarding flow. */
        private String stage;
        /** User's most urgent job-search blocker: direction, resume, project, interview, or planning. */
        private String painPoint;
        /** User self-reported resume state from onboarding. This is not proof that a resume exists in the system. */
        private String hasResume;
        /** More precise resume readiness from the first-run intake: ready, draft, none, unsure. */
        private String resumeStatus;
        /** Self-reported job-search timeline. */
        private String timeline;
        private EducationBlock education;
        private String weeklyAvailability;
        private String priorityHelp;
        private String recommendedEntry;
        /** ISO timestamp from the client when the onboarding setup was completed. */
        private String onboardingCompletedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EducationBlock {
        private String school;
        private String major;
        private String degree;
        private String graduationYear;
    }
}
