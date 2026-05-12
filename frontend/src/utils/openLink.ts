import { ref } from 'vue';
import { translate } from '@/locales';

export function openLink(url: string, title?: string) {
  // #ifdef H5
  window.open(url, '_blank');
  // #endif

  // #ifdef MP-WEIXIN
  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}`,
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
