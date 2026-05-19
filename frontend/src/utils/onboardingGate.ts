import { getProfileSnapshotApi, type UpdateOnboardingDTO, type UserProfileSnapshot } from '@/api/user';
import { isRealUser } from '@/utils/auth';
import { ONBOARDING_SETUP_KEY } from '@/utils/onboardingSync';

export const ONBOARDING_SEEN_KEY = 'onboarding_v1_seen';

export type StoredOnboardingSetup = UpdateOnboardingDTO & {
  userId?: number;
  targetRole?: string;
};

const hasText = (value?: string | null): value is string => typeof value === 'string' && value.trim().length > 0;

const hasObjectValue = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).some((item) => {
    if (typeof item === 'string') return item.trim().length > 0;
    return item !== null && item !== undefined;
  });
};

const withTimeout = async <T>(work: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('onboarding_snapshot_timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const readStoredOnboardingSetup = (): StoredOnboardingSetup | null => {
  const stored = uni.getStorageSync(ONBOARDING_SETUP_KEY);
  if (!stored || typeof stored !== 'object') return null;
  const setup = stored as StoredOnboardingSetup;
  const uid = Number(uni.getStorageSync('userId'));
  return uid && setup.userId === uid ? setup : null;
};

export const hasSeenOnboardingForCurrentUser = (): boolean => {
  const seen = uni.getStorageSync(ONBOARDING_SEEN_KEY);
  const uid = Number(uni.getStorageSync('userId'));
  if (!uid) return false;
  return !!seen && typeof seen === 'object' && Number((seen as { userId?: number }).userId) === uid;
};

export const snapshotToOnboardingSetup = (snapshot?: UserProfileSnapshot | null): StoredOnboardingSetup | null => {
  if (!snapshot) return null;
  const onboarding = snapshot.onboarding;
  const targetRole = snapshot.preferences?.targetRole
    || snapshot.resume?.targetJob
    || snapshot.interview?.positionName
    || snapshot.assessment?.suggestedRoles?.find(hasText)
    || '';

  const setup: StoredOnboardingSetup = {
    identityType: onboarding?.identityType || onboarding?.stage,
    stage: onboarding?.stage || onboarding?.identityType,
    targetRole,
    painPoint: onboarding?.painPoint,
    hasResume: onboarding?.hasResume,
    resumeStatus: onboarding?.resumeStatus,
    timeline: onboarding?.timeline,
    education: onboarding?.education,
    weeklyAvailability: onboarding?.weeklyAvailability,
    priorityHelp: onboarding?.priorityHelp,
    recommendedEntry: onboarding?.recommendedEntry,
    onboardingCompletedAt: onboarding?.onboardingCompletedAt,
  };

  const hasOnboarding = !!onboarding && (
    hasText(onboarding.onboardingCompletedAt)
    || hasText(onboarding.identityType)
    || hasText(onboarding.stage)
    || hasText(onboarding.resumeStatus)
    || hasText(onboarding.painPoint)
    || hasText(onboarding.timeline)
    || hasText(onboarding.weeklyAvailability)
    || hasText(onboarding.priorityHelp)
    || hasObjectValue(onboarding.education)
  );

  const hasUsageTrace = !!snapshot.assessment
    || !!snapshot.resume
    || !!snapshot.interview
    || hasText(targetRole);

  return hasOnboarding || hasUsageTrace ? setup : null;
};

export const markOnboardingSeen = (setup?: StoredOnboardingSetup | null) => {
  const uid = Number(uni.getStorageSync('userId'));
  if (setup) uni.setStorageSync(ONBOARDING_SETUP_KEY, { ...setup, userId: uid });
  uni.setStorageSync(ONBOARDING_SEEN_KEY, { userId: uid, seenAt: new Date().toISOString() });
};

export const shouldForceOnboarding = async (): Promise<boolean> => {
  if (hasSeenOnboardingForCurrentUser()) return false;

  const localSetup = readStoredOnboardingSetup();
  if (localSetup) {
    markOnboardingSeen(localSetup);
    return false;
  }

  if (!isRealUser()) return true;

  try {
    const snapshot = await withTimeout(getProfileSnapshotApi(), 1500);
    const serverSetup = snapshotToOnboardingSetup(snapshot);
    if (serverSetup) {
      markOnboardingSeen(serverSetup);
      return false;
    }
    return true;
  } catch {
    // Prefer the first-run gate over a blank launch if the snapshot endpoint is
    // unavailable; returning users can still leave onboarding or edit details.
    return true;
  }
};
