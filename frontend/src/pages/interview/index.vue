<template>
  <SlPage class="app-soft-bg legacy-bridge" :custom-class="[themeClass, fontClass].join(' ')" :style="{ paddingTop: topSafeHeight + 'px' }">
    <text class="bridge-title">{{ t('common.loading') }}</text>
    <text class="bridge-copy"></text>
  </SlPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from '@/locales';
import SlPage from '@/style-library/components/SlPage.vue';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafeHeight = ref(52);

onMounted(() => {
  refreshTheme();
  topSafeHeight.value = getMpSafeAreaMetrics().contentTop;
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/interview/start' });
  }, 80);
});
</script>

<style scoped>
.sl-page :deep(.legacy-bridge) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
}

.bridge-title {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.bridge-copy {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary, #64748b);
}
</style>
