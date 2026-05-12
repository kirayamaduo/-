<template>
  <view class="onboarding-page app-soft-bg" :class="[themeClass, fontClass]">
    <view class="top-safe-spacer" :style="{ height: topSafeHeight + 'px' }"></view>

    <swiper
      class="slides"
      :current="current"
      :duration="350"
      :indicator-dots="false"
      @change="onSlideChange"
    >
      <!-- Slide 1: Welcome -->
      <swiper-item class="slide">
        <view class="slide-inner">
          <view class="slide-emoji"><text class="ri-graduation-cap-line"></text></view>
          <text class="slide-title">{{ t('onboarding.slide1Title') }}</text>
          <text class="slide-desc">{{ t('onboarding.slide1Desc') }}</text>
          <view class="feature-list">
            <view class="feature-row app-card-soft app-surface ui-list-item">
              <text class="feature-icon ri-robot-2-line"></text>
              <text class="feature-text">{{ t('onboarding.feature1') }}</text>
            </view>
            <view class="feature-row app-card-soft app-surface ui-list-item">
              <text class="feature-icon ri-focus-2-line"></text>
              <text class="feature-text">{{ t('onboarding.feature2') }}</text>
            </view>
            <view class="feature-row app-card-soft app-surface ui-list-item">
              <text class="feature-icon ri-mic-2-line"></text>
              <text class="feature-text">{{ t('onboarding.feature3') }}</text>
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- Slide 2: AI Personas -->
      <swiper-item class="slide">
        <view class="slide-inner">
          <view class="slide-emoji"><text class="ri-sparkling-line"></text></view>
          <text class="slide-title">{{ t('onboarding.slide2Title') }}</text>
          <text class="slide-desc">{{ t('onboarding.slide2Desc') }}</text>
          <view class="persona-list">
            <view class="persona-card app-card-soft app-surface">
              <text class="persona-emoji ri-emotion-line"></text>
              <view class="persona-info">
                <text class="persona-name">{{ t('onboarding.persona1Name') }}</text>
                <text class="persona-role">{{ t('onboarding.persona1Role') }}</text>
              </view>
            </view>
            <view class="persona-card app-card-soft app-surface">
              <text class="persona-emoji ri-fire-line"></text>
              <view class="persona-info">
                <text class="persona-name">{{ t('onboarding.persona2Name') }}</text>
                <text class="persona-role">{{ t('onboarding.persona2Role') }}</text>
              </view>
            </view>
            <view class="persona-card app-card-soft app-surface">
              <text class="persona-emoji ri-mic-line"></text>
              <view class="persona-info">
                <text class="persona-name">{{ t('onboarding.persona3Name') }}</text>
                <text class="persona-role">{{ t('onboarding.persona3Role') }}</text>
              </view>
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- Slide 3: Get Started -->
      <swiper-item class="slide">
        <view class="slide-inner">
          <view class="slide-emoji"><text class="ri-rocket-line"></text></view>
          <text class="slide-title">{{ t('onboarding.slide3Title') }}</text>
          <text class="slide-desc">{{ t('onboarding.slide3Desc') }}</text>
          <view class="tip-card app-card-soft app-surface">
            <text class="tip-title">{{ t('onboarding.tipsTitle') }}</text>
            <text class="tip-item">{{ t('onboarding.tip1') }}</text>
            <text class="tip-item">{{ t('onboarding.tip2') }}</text>
            <text class="tip-item">{{ t('onboarding.tip3') }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- Dot indicators -->
    <view class="dots">
      <view
        v-for="(_, i) in 3"
        :key="i"
        class="dot"
        :class="{ 'dot-active': current === i }"
      />
    </view>

    <!-- Bottom actions -->
    <view class="bottom-bar">
      <view v-if="current < 2" class="btn-row">
        <text class="btn-skip" @click="finish">{{ t('onboarding.skip') }}</text>
        <view class="btn-next" @click="next">
          <text class="btn-next-text">{{ t('onboarding.next') }}</text>
          <text class="btn-next-arrow">→</text>
        </view>
      </view>
      <view v-else class="btn-row btn-row-single">
        <view class="btn-start" @click="finish">
          <text class="btn-start-text">{{ t('onboarding.start') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from '@/locales';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const ONBOARDING_KEY = 'onboarding_v1_seen';

const current = ref(0);
const topSafeHeight = ref(52);

onMounted(() => {
  refreshTheme();
  topSafeHeight.value = getMpSafeAreaMetrics().contentTop;
});

const onSlideChange = (e: any) => {
  current.value = e.detail.current;
};

const next = () => {
  if (current.value < 2) current.value++;
};

const finish = () => {
  uni.setStorageSync(ONBOARDING_KEY, '1');
  if (uni.getStorageSync('userId')) {
    uni.reLaunch({ url: '/pages/home/index' });
  } else {
    uni.reLaunch({ url: '/pages/login/index' });
  }
};
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.top-safe-spacer {
  width: 100%;
  flex-shrink: 0;
}

.slides {
  width: 100%;
  height: calc(72vh - 52px);
}

.slide { width: 100%; height: 100%; }

.slide-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px 0;
  box-sizing: border-box;
}

.slide-emoji {
  font-size: 72px;
  line-height: 1;
  margin-bottom: 24px;
}

.slide-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
  text-align: center;
  margin-bottom: 16px;
}

.slide-desc {
  font-size: 15px;
  line-height: 1.65;
  color: var(--text-secondary, #64748b);
  text-align: center;
  margin-bottom: 28px;
}

/* Slide 1: feature list */
.feature-list { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.feature-row {
  display: flex; align-items: center; gap: 12px;
  border-radius: var(--btn-radius, 14px);
  padding: 14px 16px;
}
.feature-icon { font-size: 22px; }
.feature-text { font-size: 14px; color: var(--text-primary, #0f172a); font-weight: 500; flex: 1; }

/* Slide 2: personas */
.persona-list { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.persona-card {
  display: flex; align-items: center; gap: 14px;
  border-radius: var(--radius-md, 16px);
  padding: 16px;
}
.persona-emoji { font-size: 32px; }
.persona-info { display: flex; flex-direction: column; gap: 3px; }
.persona-name { font-size: 16px; font-weight: 700; color: var(--text-primary, #0f172a); }
.persona-role { font-size: 13px; color: var(--text-secondary, #64748b); }

/* Slide 3: tip card */
.tip-card {
  width: 100%;
  border-radius: var(--radius-md, 16px);
  padding: 20px;
}
.tip-title { font-size: 15px; font-weight: 700; color: #065f46; display: block; margin-bottom: 14px; }
.tip-item { font-size: 14px; color: var(--text-secondary, #64748b); line-height: 1.6; display: block; margin-bottom: 6px; }

/* Dots */
.dots {
  display: flex; gap: 8px; margin: 16px 0;
}
.dot {
  width: 8px; height: 8px; border-radius: 4px;
  background: #cbd5e1;
  transition: all 0.3s;
}
.dot-active {
  width: 24px;
  background: var(--primary-color, #2563eb);
}

/* Bottom bar */
.bottom-bar {
  width: 100%;
  padding: 0 24px 32px;
  box-sizing: border-box;
}
.btn-row {
  display: flex; align-items: center; justify-content: space-between;
}
.btn-row-single { justify-content: center; }

.btn-skip {
  font-size: 15px; color: var(--text-tertiary, #8e8e93); font-weight: 500;
  padding: 12px 8px;
}

.btn-next {
  display: flex; align-items: center; gap: 6px;
  background: var(--primary-color, #2563eb); border-radius: var(--radius-md, 16px);
  padding: 14px 28px;
  min-height: 50px;
}
.btn-next-text { font-size: 16px; font-weight: 700; color: #ffffff; }
.btn-next-arrow { font-size: 18px; color: #ffffff; }

.btn-start {
  width: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-md, 16px);
  padding: 16px 0;
  text-align: center;
  min-height: 52px;
  display: flex; align-items: center; justify-content: center;
}
.btn-start-text { font-size: 17px; font-weight: 700; color: #ffffff; }
</style>
