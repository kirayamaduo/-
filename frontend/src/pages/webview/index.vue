<template>
  <SlPage class="app-soft-bg" :custom-class="[themeClass, fontClass].join(' ')">
    <SlNavBar :title="title" show-back @back="goBack" :safe-top="topSafe" />
    <web-view v-if="url" :src="url" @error="handleError"></web-view>
    <view class="fallback" v-if="showFallback">
      <view class="fallback-card app-card-soft app-surface">
        <text class="fb-icon ri-link"></text>
        <text class="fb-text">{{ t('webview.fallbackText') }}</text>
        <text class="fb-url">{{ url }}</text>
        <button class="btn-copy" @click="copyUrl">{{ t('webview.copyBtn') }}</button>
      </view>
    </view>
  </SlPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { onLoad } from '@dcloudio/uni-app';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';
import SlPage from '@/style-library/components/SlPage.vue';
import SlNavBar from '@/style-library/components/SlNavBar.vue';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafe = ref(44);
const url = ref('');
const title = ref('');
const showFallback = ref(false);

const goBack = () => uni.navigateBack();

onMounted(() => {
  refreshTheme();
  topSafe.value = getMpSafeAreaMetrics().topSafeHeight;
});

onLoad((options: any) => {
  if (options.url) {
    url.value = decodeURIComponent(options.url);
  }
  if (options.title) {
    title.value = decodeURIComponent(options.title);
    uni.setNavigationBarTitle({ title: title.value });
  }
});

const handleError = () => {
  showFallback.value = true;
};

const copyUrl = () => {
  uni.setClipboardData({
    data: url.value,
    success: () => {
      uni.showToast({ title: t('webview.copied'), icon: 'success' });
    }
  });
};
</script>

<style scoped>
.sl-page :deep(.webview-container) {
  width: 100vw;
  min-height: 100vh;
}

.fallback {
  padding: 40px 20px;
  height: 100%;
  box-sizing: border-box;
}

.fallback-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border-radius: var(--radius-lg, 20px);
}

.fb-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.fb-text {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 24px;
  text-align: center;
}

.fb-url {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 32px;
  text-align: center;
  word-break: break-all;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  width: 100%;
}

.btn-copy {
  background: var(--primary-color, #2563eb);
  color: #ffffff;
  border-radius: var(--btn-radius, 14px);
  font-size: 15px;
  font-weight: 600;
  width: 100%;
  height: 48px;
  line-height: 48px;
  border: none;
}

.is-dark .fb-text { color: #f8fafc; }
.is-dark .fb-url { background: #1e293b; color: #cbd5e1; }
</style>
