package com.group1.career.service;

import com.group1.career.model.dto.UserProfileSnapshot;

/**
 * Cross-tool user portrait. Persists into {@code users.profile_snapshot}.
 *
 * <p>Read-side: every consumer (assistant, interview start, resume diagnosis)
 * calls {@link #read(Long)} which always returns a non-null snapshot
 * (with all blocks possibly null) so callers don't have to NPE-guard.
 *
 * <p>Write-side: each producer calls the matching {@code merge*} method.
 * Each merge is independent — writing assessment never clobbers resume.
 * All writes also bump {@code updatedAt} so downstream caches can decide
 * whether to refresh.
 */
public interface UserProfileSnapshotService {

    /**
     * Always returns a snapshot — empty (all blocks null) if the user has no
     * persisted portrait yet, or has corrupted JSON. Never throws.
     */
    UserProfileSnapshot read(Long userId);

    /**
     * Render the snapshot as a compact human-readable block ready to drop
     * into an LLM system prompt. Empty string if the snapshot is empty.
     * Trimmed and de-duplicated so we don't waste tokens.
     */
    String renderForPrompt(Long userId);

    /** Merge a fresh assessment result into the user's snapshot. */
    void mergeAssessment(Long userId, UserProfileSnapshot.AssessmentBlock block);

    /** Merge a fresh resume upload / update into the user's snapshot. */
    void mergeResume(Long userId, UserProfileSnapshot.ResumeBlock block);

    /** Merge a finished interview / report into the user's snapshot. */
    void mergeInterview(Long userId, UserProfileSnapshot.InterviewBlock block);

    /** Merge changes to user-chosen preferences (target role, interview mode). */
    void mergePreferences(Long userId, UserProfileSnapshot.PreferencesBlock block);

    /** Merge the user's self-reported onboarding setup into the snapshot. */
    void mergeOnboarding(Long userId, UserProfileSnapshot.OnboardingBlock block);
}
