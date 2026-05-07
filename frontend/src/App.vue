<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { isLoggedIn, LOGIN_PAGE } from "@/utils/auth";
import { useTheme } from "@/utils/theme";
import { updateTabBar } from "@/locales/index";

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
  }
});
</script>

<style>
/* 全局 CSS 变量：科技蓝 + 活力橙，深浅色与业务页面对齐 */
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-mid: #3b82f6;
  --primary-soft: #eff6ff;

  --accent-color: #f97316;
  --accent-hover: #ea580c;
  --accent-soft: #fff7ed;

  /* 与 Tab 内页统一的浅灰底 */
  --page-ios-gray: #f5f5f7;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-tertiary: #8e8e93;
  --border-color: #b8c8d8;
  --border-strong: #9aafc5;
  --interactive-label: var(--primary-color);

  --surface-1: #ffffff;
  --surface-2: #f8fafc;
  --surface-3: #f1f5f9;

  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;

  --shadow-xs:   0 1px 3px rgba(0,0,0,0.08),  0 1px 8px  rgba(0,0,0,0.05);
  --shadow-sm:   0 2px 8px  rgba(0,0,0,0.12),  0 1px 3px  rgba(0,0,0,0.07);
  --shadow-card: 0 4px 16px rgba(0,0,0,0.14),  0 2px 6px  rgba(0,0,0,0.08);
  --shadow-lg:   0 8px 24px rgba(0,0,0,0.18),  0 4px 10px rgba(0,0,0,0.10);

  --nav-back-width: 64px;

  --btn-height-md: 48px;
  --btn-height-lg: 52px;
  --btn-radius: 14px;

  --font-hero: 28px;
  --font-title: 18px;
  --font-section: 17px;
  --font-body: 15px;
  --font-caption: 13px;
  --font-micro: 11px;

  --line-height-body: 1.5;
  --line-height-caption: 1.45;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;

  --page-gutter: 20px;
  --page-gutter-tight: 16px;
  --content-max-width: 560px;

  /* Custom tab bar list height (uni-app default ~50px); pad scroll areas above it */
  --tab-bar-height: 50px;
}

/* 跟随系统的深色变量（业务页可另加 .theme-dark 覆盖） */
/* #ifndef H5 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #0f172a;
    --page-ios-gray: #0f172a;
    --card-bg: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-tertiary: #94a3b8;
    --border-color: #334155;
    --primary-soft: rgba(37, 99, 235, 0.2);
    --accent-soft: rgba(249, 115, 22, 0.15);
  }
}
/* #endif */

/* ─── F5: 护眼绿主题 ─── */
.theme-green {
  background-color: #f0fdf4 !important;
}
.theme-green .ui-card,
.theme-green .card,
.theme-green .panel,
.theme-green .section-card,
.theme-green .app-surface {
  background: #ffffff;
  border-color: #bbf7d0;
  box-shadow: 0 2px 8px rgba(5,150,105,0.08), 0 1px 3px rgba(5,150,105,0.05);
}
.theme-green .ui-list-item,
.theme-green .list-item,
.theme-green .item {
  border-color: #bbf7d0;
}
.theme-green .ui-btn-primary,
.theme-green .btn-primary,
.theme-green .btn-send {
  background: #059669;
  box-shadow: 0 4px 12px rgba(5,150,105,0.3);
}
.theme-green .ui-input,
.theme-green .input,
.theme-green textarea.ui-input {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

/* ─── F6: 字号档位 ─── */
.font-compact {
  --font-hero:    22px;
  --font-title:   15px;
  --font-section: 14px;
  --font-body:    12px;
  --font-caption: 10px;
  --font-micro:   9px;
}
.font-large {
  --font-hero:    36px;
  --font-title:   23px;
  --font-section: 21px;
  --font-body:    19px;
  --font-caption: 17px;
  --font-micro:   15px;
}

.font-compact text,
.font-compact input,
.font-compact textarea,
.font-compact button {
  font-size: 12px !important;
}
.font-compact .page-title,
.font-compact .greeting-title,
.font-compact .hero-title,
.font-compact .title,
.font-compact .summary-title {
  font-size: 24px !important;
}
.font-compact .section-title,
.font-compact .card-title,
.font-compact .nav-title {
  font-size: 16px !important;
}
.font-large text,
.font-large input,
.font-large textarea,
.font-large button {
  font-size: 17px !important;
}
.font-large .page-title,
.font-large .greeting-title,
.font-large .hero-title,
.font-large .title,
.font-large .summary-title {
  font-size: 34px !important;
}
.font-large .section-title,
.font-large .card-title,
.font-large .nav-title {
  font-size: 22px !important;
}

.is-dark,
.is-dark.app-shell,
.is-dark[class*="-page"],
.is-dark[class*="-container"] {
  background: #0f172a !important;
  color: #e2e8f0;
}
.is-dark text {
  color: #e2e8f0 !important;
}
.is-dark .app-surface,
.is-dark .ui-card,
.is-dark .card,
.is-dark .panel,
.is-dark .section-card,
.is-dark .menu-card,
.is-dark .stats-bar,
.is-dark .empty-state,
.is-dark .modal-content,
.is-dark .form-sheet,
.is-dark .facts-card,
.is-dark .welcome-card,
.is-dark .quick-chip,
.is-dark .persona-chip,
.is-dark .search-bar,
.is-dark .field-input,
.is-dark .ui-input,
.is-dark .input {
  background: #1e293b !important;
  border-color: #334155 !important;
  box-shadow: none !important;
}
.is-dark .surface-muted,
.is-dark .skeleton-card,
.is-dark .tag,
.is-dark .pill,
.is-dark .chip,
.is-dark .picker-box,
.is-dark .fact-delete-btn {
  background: #334155 !important;
  border-color: #475569 !important;
}
.is-dark .app-page-title,
.is-dark .page-title,
.is-dark .title,
.is-dark .hero-title,
.is-dark .summary-title,
.is-dark .section-title,
.is-dark .card-title,
.is-dark .nav-title,
.is-dark .menu-text,
.is-dark .field-label,
.is-dark .empty-title {
  color: #f8fafc !important;
}
.is-dark .app-page-subtitle,
.is-dark .page-subtitle,
.is-dark .subtitle,
.is-dark .hero-subtitle,
.is-dark .summary-text,
.is-dark .section-meta,
.is-dark .empty-desc,
.is-dark .field-hint,
.is-dark .desc {
  color: #94a3b8 !important;
}
.is-dark input,
.is-dark textarea {
  color: #f8fafc !important;
}
.is-dark .ph,
.is-dark .search-ph,
.is-dark .input-ph {
  color: #64748b !important;
}
.is-dark .btn-primary,
.is-dark .btn-send,
.is-dark .send-active,
.is-dark .pill-active {
  background: #3b82f6 !important;
  color: #ffffff !important;
}

/* 全局基础样式 */
page {
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.app-shell {
  min-height: 100vh;
  background: var(--page-ios-gray);
  padding: 0 20px;
  box-sizing: border-box;
}

.app-page-header {
  padding: 8px 0 18px;
}

.app-page-kicker {
  display: block;
  font-size: 11px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.app-page-title {
  display: block;
  font-size: var(--font-hero);
  line-height: 1.15;
  font-weight: 800;
  color: var(--text-primary);
}

.app-page-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}

.app-section-title {
  display: block;
  font-size: var(--font-section);
  line-height: 1.3;
  font-weight: 700;
  color: var(--text-primary);
}

.app-section-meta {
  font-size: var(--font-caption);
  color: var(--text-tertiary);
}

.app-surface {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.app-list-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-empty {
  padding: 56px 20px 28px;
  text-align: center;
}

.app-empty__title {
  display: block;
  margin-top: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.app-empty__desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-secondary);
}

/* #ifdef H5 */
html,
body,
#app {
  height: 100%;
  overflow-x: hidden;
}
/* #endif */

/* 全局视觉系统：统一卡片、输入框、按钮、列表项 */
.ui-card,
.card,
.panel,
.section-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.ui-card-strong {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-card);
}

.ui-input,
.input,
textarea.ui-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--surface-1);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  min-height: 44px;
  padding: 0 12px;
  color: var(--text-primary);
  font-size: 14px;
}

.ui-list-item,
.list-item,
.item {
  background: var(--surface-1);
  border: 1px solid var(--border-color);
  border-radius: 14px;
}

button {
  box-sizing: border-box;
  font-family: inherit;
}

.ui-btn,
.btn-primary,
.btn-secondary,
.btn-send,
.btn-choose,
.btn-upload-cloud {
  border-radius: var(--btn-radius);
  min-height: var(--btn-height-md);
  line-height: var(--btn-height-md);
  font-weight: 600;
  border: 1px solid transparent;
}

.ui-btn-primary,
.btn-primary,
.btn-send {
  background: var(--primary-color);
  color: #fff;
  box-shadow: var(--shadow-card);
}

.ui-btn-secondary,
.btn-secondary,
.btn-choose,
.btn-upload-cloud {
  background: var(--surface-2);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* #ifndef H5 */
@media (prefers-color-scheme: dark) {
  .ui-card,
  .card,
  .panel,
  .section-card,
  .ui-list-item,
  .list-item,
  .item {
    box-shadow: none;
    border-color: var(--border-color);
  }

  .ui-input,
  .input,
  textarea.ui-input {
    background: #0f172a;
  }

  .ui-btn-secondary,
  .btn-secondary,
  .btn-choose,
  .btn-upload-cloud {
    background: #1e293b;
    color: #e2e8f0;
  }
}
/* #endif */

/* ============================================================== *
 *  WeChat Mini-Program parity layer
 *  -----------------------------------------------------------------
 *  IMPORTANT: CSS custom properties set on :root / page do NOT
 *  reliably cascade into scoped component <style> blocks in the
 *  mini-program runtime (the variable is resolved at compile time,
 *  not inherited from the document root). Therefore we AVOID
 *  re-declaring variables here and instead directly override the
 *  concrete CSS properties on known global selectors.
 * ============================================================== */
/* #ifdef MP-WEIXIN */

/* 1) Global page background: slightly darker blue-gray so white cards
      have strong contrast and shadows become perceptible. */
page {
  background-color: #eaeff5;
}

/* 2) Kill WeChat's native <button> decoration. */
button {
  background: transparent;
  padding: 0;
  margin: 0;
  line-height: inherit;
  border: none;
}
button::after {
  border: none !important;
  border-radius: 0 !important;
  content: none !important;
}

/* 3) Global card selectors: hardcode shadow + border directly so the
      values are NOT dependent on CSS variable resolution. */
.ui-card,
.card,
.panel,
.section-card,
.app-surface,
.ui-card-strong {
  overflow: visible;
  border: 1.5px solid #b0bfd0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.22),
              0 2px 6px  rgba(0,0,0,0.12);
}

/* 4) Global list items (menu rows, etc.) */
.ui-list-item,
.list-item,
.item {
  border: 1.5px solid #b0bfd0;
}

/* 5) Inputs: pin font-size and color.
      Only apply the stronger border to elements that use the .ui-input
      / .input utility classes (form inputs). Do NOT add border to bare
      <input> / <textarea> elements — those are used inside custom
      wrappers (like the chat bar) that provide their own border. */
.ui-input,
.input,
textarea.ui-input {
  font-size: 14px;
  color: #0f172a;
  border: 1.5px solid #b0bfd0;
}
input,
textarea {
  font-size: 14px;
  color: #0f172a;
}

/* 6) backdrop-filter unsupported — replace frosted navbars/footers
      with solid fallbacks. */
.chat-nav,
.sticky-cta,
.bottom-bar,
.toolbar,
.nav-bar {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.chat-nav  { background: #ffffff; }
.sticky-cta,
.bottom-bar,
.toolbar   { background: #f5f5f7; }

/* #endif */
</style>
