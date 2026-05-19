import { translate } from '@/locales';

// This mini program account currently has no web-view business-domain entry.
// Keep MP external links as copy-only to avoid "page cannot be opened" on phones.
const MP_WEBVIEW_HOSTS: string[] = [];

const hostOf = (url: string) => {
  const match = url.match(/^https?:\/\/([^/?#]+)/i);
  return match?.[1]?.replace(/^www\./i, '').toLowerCase() || '';
};

const canOpenInMpWebview = (url: string) => {
  const host = hostOf(url);
  return MP_WEBVIEW_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
};

export function openLink(url: string, title?: string) {
  // #ifdef H5
  window.open(url, '_blank');
  // #endif

  // #ifdef MP-WEIXIN
  if (!canOpenInMpWebview(url)) {
    uni.setClipboardData({
      data: url,
      success: () => {
        uni.showToast({ title: translate('webview.copied'), icon: 'none' });
      }
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}&mode=webview`,
    fail: () => {
      // Fallback if navigation fails
      uni.setClipboardData({
        data: url,
        success: () => {
          uni.showToast({ title: translate('webview.copied'), icon: 'none' });
        }
      });
    }
  });
  // #endif
  
  // #ifndef H5 || MP-WEIXIN
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({ title: translate('webview.copied'), icon: 'none' });
    }
  });
  // #endif
}
