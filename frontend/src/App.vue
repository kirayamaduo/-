<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { isLoggedIn, LOGIN_PAGE } from "@/utils/auth";
import { useTheme } from "@/utils/theme";
import { updateTabBar } from "@/locales/index";
import { syncPendingOnboarding } from "@/utils/onboardingSync";
import { shouldForceOnboarding } from "@/utils/onboardingGate";

const LANDING_KEY = 'zhihui_landing_seen';
const LANDING_PAGE = '/pages/landing/index';
const ONBOARDING_PAGE = '/pages/onboarding/index';
const HOME_PAGE = '/pages/home/index';
const { refresh: refreshTheme } = useTheme();

// Pages that should "stick" — i.e. if WeChat restored the user back to them
// (deep-link scene, share path, etc.) we should NOT force-redirect to home.
// Anything not on this allow-list is treated as a stale restore from a
// previous session and bounced to /pages/home/index. This stops the
// experience-build scan flow from dropping users onto a random inner page.
const STICKY_ENTRY_PAGES = new Set<string>([
  'pages/home/index',
  'pages/assistant/index',
  'pages/resume/index',
  'pages/user/index',
  'pages/landing/index',
  'pages/login/index',
  'pages/consent/index',
  'pages/onboarding/index',
]);

const getEntryPagePath = (): string | undefined => {
  // #ifdef MP-WEIXIN
  try {
    const wxAny: any = (globalThis as any).wx;
    const info = wxAny?.getLaunchOptionsSync?.() || wxAny?.getEnterOptionsSync?.();
    return info?.path as string | undefined;
  } catch {
    return undefined;
  }
  // #endif
  // #ifndef MP-WEIXIN
  return undefined;
  // #endif
};

onLaunch(() => {
  refreshTheme();
  // pages.json 里的 tabBar text 是静态值，需在启动时用检测到的语言覆盖
  updateTabBar();

  // First launch is now a product introduction, then login, then onboarding.
  // This keeps anonymous users from filling a profile setup that cannot be
  // persisted yet, while still letting returning users enter directly.
  const hasSeenLanding = uni.getStorageSync(LANDING_KEY);
  if (!isLoggedIn()) {
    uni.reLaunch({ url: hasSeenLanding ? LOGIN_PAGE : LANDING_PAGE });
    return;
  }

  shouldForceOnboarding().then((force) => {
    if (force) {
      uni.reLaunch({ url: ONBOARDING_PAGE });
    }
  }).catch(() => {
    uni.reLaunch({ url: ONBOARDING_PAGE });
  });

  // Cold-start gate: real users *and* guests both keep their session.
  // Previously a guest's lack of `userId` would bounce them back to the
  // login page on every relaunch; the auth helper now treats the guest
  // sentinel id as "logged in for navigation purposes."
  if (!isLoggedIn()) {
    uni.reLaunch({ url: LOGIN_PAGE });
    return;
  }

  // If onboarding was completed while offline or as a guest, login sync may
  // have failed once. Retry quietly on the next real-account launch so stale
  // pending setup does not keep resubmitting or confuse the first-run state.
  syncPendingOnboarding({ silent: true }).catch(() => {
    // Keep pending storage for the next launch; do not block app entry.
  });

  // Cold-start scene normalization. WeChat may restore us to whatever inner
  // page a previous session ended on (e.g. /pages/assessment/index when the
  // QA team scanned the experience-build QR code); for a returning, fully-
  // onboarded user the only sensible entry is the home dashboard. We
  // explicitly redirect off any non-allow-listed page so the first thing the
  // user sees is the home tab rather than a deep inner page that they did
  // not navigate to themselves.
  const entryPath = (getEntryPagePath() || '').replace(/^\//, '');
  if (entryPath && !STICKY_ENTRY_PAGES.has(entryPath)) {
    uni.reLaunch({ url: HOME_PAGE });
  }
});
</script>

<style>
@import '@/style-library/styles/index.css';
</style>
