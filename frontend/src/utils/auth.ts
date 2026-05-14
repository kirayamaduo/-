/**
 * Auth + guest helpers shared across pages.
 *
 * The mini-program supports two "logged-in" states:
 *  - Real account  → `userId` is a positive integer + `token` is set.
 *  - Guest preview → `isGuest` flag + `userId === -1`. No token; auth-required
 *    APIs are gated behind {@link requireAuth} so the guest is steered to the
 *    sign-in flow at the moment they reach for a feature that needs a real
 *    account (e.g. starting an interview, uploading a resume).
 *
 * Storing `userId === -1` for guests is what fixes the cold-start bug where
 * guests were silently kicked back to the login page on app relaunch — the
 * App.vue boot check is now happy with either a real id or the guest sentinel.
 */
export const LOGIN_PAGE = '/pages/login/index';

export const GUEST_USER_ID = -1;

export const isGuest = (): boolean => {
  const userId = Number(uni.getStorageSync('userId'));
  return uni.getStorageSync('isGuest') === true && userId === GUEST_USER_ID;
};

export const isLoggedIn = (): boolean => {
  const userId = uni.getStorageSync('userId');
  if (!userId) return false;
  // Guests count as "logged in" for navigation purposes only — see requireAuth.
  if (Number(userId) === GUEST_USER_ID) return true;
  return Number(userId) > 0;
};

/** Real account check — false for guest sessions. */
export const isRealUser = (): boolean => {
  const userId = uni.getStorageSync('userId');
  if (!userId) return false;
  return Number(userId) > 0 && !isGuest();
};

export const enterGuestMode = () => {
  uni.removeStorageSync('token');
  uni.setStorageSync('userId', GUEST_USER_ID);
  uni.setStorageSync('isGuest', true);
  uni.setStorageSync('userInfo', { nickname: 'Guest', avatarUrl: '' });
};

export const clearAuthState = () => {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userId');
  uni.removeStorageSync('userInfo');
  uni.removeStorageSync('isGuest');
};

/**
 * Gate a feature that needs a real account (interview start, resume upload,
 * notification mark-as-read, etc.). Guests are nudged to upgrade rather
 * than silently failing on a 401.
 */
export const requireAuth = (redirectType: 'reLaunch' | 'navigateTo' = 'reLaunch'): boolean => {
  if (isRealUser()) return true;

  uni.showToast({
    title: isGuest() ? 'Please sign in to use this feature' : 'Please sign in to continue',
    icon: 'none',
  });

  setTimeout(() => {
    if (redirectType === 'navigateTo') {
      uni.navigateTo({ url: LOGIN_PAGE });
    } else {
      uni.reLaunch({ url: LOGIN_PAGE });
    }
  }, 250);

  return false;
};
