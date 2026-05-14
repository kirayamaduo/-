<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { isLoggedIn, LOGIN_PAGE } from "@/utils/auth";
import { useTheme } from "@/utils/theme";
import { updateTabBar } from "@/locales/index";
import { syncPendingOnboarding } from "@/utils/onboardingSync";

const ONBOARDING_KEY = 'onboarding_v1_seen';
const ONBOARDING_PAGE = '/pages/onboarding/index';
const { refresh: refreshTheme } = useTheme();

onLaunch(() => {
  refreshTheme();
  // pages.json 里的 tabBar text 是静态值，需在启动时用检测到的语言覆盖
  updateTabBar();

  // F20: First-run onboarding — show once, only for users who haven't
  // logged in yet. Existing users (already have a session) skip it so a
  // deploy doesn't force-redirect everyone who has been using the app.
  const hasSeenOnboarding = uni.getStorageSync(ONBOARDING_KEY);
  if (!hasSeenOnboarding && !isLoggedIn()) {
    uni.reLaunch({ url: ONBOARDING_PAGE });
    return;
  }
  // Mark as seen so the onboarding never shows again, even for guests who
  // skip past it without explicitly finishing.
  if (!hasSeenOnboarding) {
    uni.setStorageSync(ONBOARDING_KEY, '1');
  }

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
});
</script>

<style>
@import '@/style-library/styles/index.css';
</style>
