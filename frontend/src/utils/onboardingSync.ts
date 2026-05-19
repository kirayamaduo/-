import { updateOnboardingApi, type UpdateOnboardingDTO } from '@/api/user';
import { isRealUser } from '@/utils/auth';

export const ONBOARDING_SETUP_KEY = 'career_onboarding_setup';
export const PENDING_ONBOARDING_KEY = 'career_onboarding_pending';

export interface PendingOnboardingSetup extends UpdateOnboardingDTO {
  userId?: number;
  recommendedEntry?: string;
  completedAt?: string;
}

export const readPendingOnboarding = (): PendingOnboardingSetup | null => {
  const pending = uni.getStorageSync(PENDING_ONBOARDING_KEY);
  if (!pending || typeof pending !== 'object') return null;
  const setup = pending as PendingOnboardingSetup;
  const uid = Number(uni.getStorageSync('userId'));
  return uid && setup.userId === uid ? setup : null;
};

export const clearPendingOnboarding = () => {
  uni.removeStorageSync(PENDING_ONBOARDING_KEY);
};

export const syncPendingOnboarding = async (options?: { silent?: boolean }) => {
  const pending = readPendingOnboarding();
  if (!pending || !isRealUser()) return null;

  const payload: UpdateOnboardingDTO = {
    identityType: pending.identityType,
    hasResume: pending.hasResume,
    stage: pending.stage,
    painPoint: pending.painPoint,
    resumeStatus: pending.resumeStatus,
    timeline: pending.timeline,
    education: pending.education,
    weeklyAvailability: pending.weeklyAvailability,
    priorityHelp: pending.priorityHelp,
    recommendedEntry: pending.recommendedEntry,
    onboardingCompletedAt: pending.onboardingCompletedAt || pending.completedAt,
    targetRole: pending.targetRole?.trim(),
  };

  const snapshot = await updateOnboardingApi(payload, { silent: options?.silent });
  clearPendingOnboarding();
  return snapshot;
};
