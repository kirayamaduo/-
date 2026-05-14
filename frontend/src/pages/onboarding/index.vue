<template>
  <view class="onboarding-page app-soft-bg" :class="[themeClass, fontClass]">
    <view class="top-safe-spacer" :style="{ height: topSafeHeight + 'px' }"></view>

    <view class="page-shell">
      <view class="hero">
        <text class="hero-kicker">CAREER LOOP SETUP</text>
        <text class="hero-title">先锁定你的求职下一步</text>
        <text class="hero-desc">用 3 个问题建立你的求职画像，首页会直接给出今日任务。</text>
      </view>

      <view class="progress-row">
        <view
          v-for="(_, index) in steps"
          :key="index"
          class="progress-dot"
          :class="{ active: current === index, done: current > index }"
        />
      </view>

      <swiper
        class="slides"
        :current="current"
        :duration="280"
        :indicator-dots="false"
        :disable-touch="true"
      >
        <swiper-item class="slide">
          <view class="slide-inner">
            <text class="step-label">01 / 身份状态</text>
            <text class="step-title">你现在最接近哪种求职阶段？</text>
            <text class="step-desc">这会影响 AI 判断你该先补方向、简历，还是面试准备。</text>
            <view class="option-grid">
              <view
                v-for="option in identityOptions"
                :key="option.value"
                class="choice-card app-surface"
                :class="{ selected: identityType === option.value }"
                @click="identityType = option.value"
              >
                <view class="choice-icon" :class="option.tone">
                  <text :class="option.icon"></text>
                </view>
                <view class="choice-copy">
                  <text class="choice-title">{{ option.label }}</text>
                  <text class="choice-desc">{{ option.desc }}</text>
                </view>
              </view>
            </view>
          </view>
        </swiper-item>

        <swiper-item class="slide">
          <view class="slide-inner">
            <text class="step-label">02 / 目标岗位</text>
            <text class="step-title">你想先准备哪个方向？</text>
            <text class="step-desc">可以选一个常见方向，也可以直接输入你真实想投的岗位。</text>
            <view class="target-input-wrap app-surface">
              <text class="target-icon ri-focus-3-line"></text>
              <input
                class="target-input"
                v-model="targetRole"
                maxlength="32"
                placeholder="例如：前端开发工程师"
                placeholder-class="ph"
              />
            </view>
            <view class="chips">
              <view
                v-for="role in targetSuggestions"
                :key="role"
                class="role-chip"
                :class="{ selected: targetRole === role }"
                @click="targetRole = role"
              >
                <text>{{ role }}</text>
              </view>
            </view>
          </view>
        </swiper-item>

        <swiper-item class="slide">
          <view class="slide-inner">
            <text class="step-label">03 / 简历状态</text>
            <text class="step-title">你现在有可投递的简历吗？</text>
            <text class="step-desc">选择后，我们会把你带到最合适的第一步。</text>
            <view class="resume-options">
              <view
                v-for="option in resumeOptions"
                :key="option.value"
                class="resume-card app-surface"
                :class="{ selected: hasResume === option.value }"
                @click="hasResume = option.value"
              >
                <text class="resume-icon" :class="option.icon"></text>
                <view class="resume-copy">
                  <text class="resume-title">{{ option.label }}</text>
                  <text class="resume-desc">{{ option.desc }}</text>
                </view>
              </view>
            </view>

            <view class="route-preview">
              <text class="route-label">完成后进入</text>
              <text class="route-value">{{ nextDestinationLabel }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <view class="bottom-bar">
      <view class="btn-secondary" :class="{ invisible: current === 0 }" @click="prev">
        <text class="ri-arrow-left-line"></text>
        <text>上一步</text>
      </view>
      <view class="btn-primary" :class="{ disabled: !canContinue || saving }" @click="handlePrimary">
        <text>{{ primaryText }}</text>
        <text class="ri-arrow-right-line" v-if="current < steps.length - 1"></text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';
import { updateOnboardingApi } from '@/api/user';
import { ONBOARDING_SETUP_KEY, PENDING_ONBOARDING_KEY } from '@/utils/onboardingSync';

type IdentityType = 'student' | 'new_graduate' | 'career_switcher' | 'internship_seeker';
type ResumeState = 'yes' | 'no' | 'unsure';

const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const ONBOARDING_KEY = 'onboarding_v1_seen';
const SETUP_KEY = ONBOARDING_SETUP_KEY;
const PENDING_KEY = PENDING_ONBOARDING_KEY;
const RESUME_AUTO_UPLOAD_KEY = 'resume_auto_upload_once';

const steps = [0, 1, 2];
const current = ref(0);
const topSafeHeight = ref(52);
const identityType = ref<IdentityType>('student');
const targetRole = ref('');
const hasResume = ref<ResumeState>('no');
const saving = ref(false);

const identityOptions: Array<{
  value: IdentityType;
  label: string;
  desc: string;
  icon: string;
  tone: string;
}> = [
  { value: 'student', label: '在校学生', desc: '还在探索方向，需要先建立能力画像', icon: 'ri-graduation-cap-line', tone: 'tone-blue' },
  { value: 'new_graduate', label: '应届 / 准应届', desc: '准备校招、秋招、春招或毕业求职', icon: 'ri-briefcase-4-line', tone: 'tone-green' },
  { value: 'internship_seeker', label: '找实习', desc: '希望尽快补齐项目、简历和面试短板', icon: 'ri-calendar-check-line', tone: 'tone-amber' },
  { value: 'career_switcher', label: '转方向', desc: '已有经历，但需要重塑目标岗位叙事', icon: 'ri-route-line', tone: 'tone-purple' },
];

const targetSuggestions = [
  '前端开发工程师',
  'Java 后端开发',
  '产品经理',
  '数据分析师',
  '算法工程师',
  '新媒体运营',
];

const resumeOptions: Array<{
  value: ResumeState;
  label: string;
  desc: string;
  icon: string;
}> = [
  { value: 'yes', label: '有，想先诊断简历', desc: '进入我的简历，上传或选择简历做岗位匹配诊断', icon: 'ri-file-search-line' },
  { value: 'no', label: '还没有完整简历', desc: '先做测评，明确方向后再生成简历素材', icon: 'ri-compass-3-line' },
  { value: 'unsure', label: '不确定是否能投', desc: '先做测评建立基线，再回到简历准备', icon: 'ri-question-answer-line' },
];

const trimmedTargetRole = computed(() => targetRole.value.trim());

const nextDestinationLabel = computed(() => (
  hasResume.value === 'yes' ? '简历上传与匹配诊断' : '职业测评与方向校准'
));

const canContinue = computed(() => {
  if (current.value === 0) return !!identityType.value;
  if (current.value === 1) return !!trimmedTargetRole.value;
  return !!hasResume.value;
});

const primaryText = computed(() => (
  current.value < steps.length - 1 ? '下一步' : (saving.value ? '保存中…' : '开始今日任务')
));

onMounted(() => {
  refreshTheme();
  topSafeHeight.value = getMpSafeAreaMetrics().contentTop;
});

const prev = () => {
  if (current.value > 0) current.value--;
};

const next = () => {
  if (!canContinue.value) {
    uni.showToast({ title: current.value === 1 ? '请先填写目标岗位' : '请先完成当前选择', icon: 'none' });
    return;
  }
  if (current.value < steps.length - 1) current.value++;
};

const routeToNextStep = () => {
  if (hasResume.value === 'yes') {
    uni.setStorageSync(RESUME_AUTO_UPLOAD_KEY, '1');
    uni.switchTab({ url: '/pages/resume/index' });
    return;
  }
  uni.reLaunch({ url: '/pages/assessment/index' });
};

const isRealUser = () => {
  const userId = Number(uni.getStorageSync('userId'));
  return userId > 0 && uni.getStorageSync('isGuest') !== true;
};

const persistSetup = async () => {
  const setup = {
    identityType: identityType.value,
    targetRole: trimmedTargetRole.value,
    hasResume: hasResume.value,
    recommendedEntry: hasResume.value === 'yes' ? 'resume' : 'assessment',
    onboardingCompletedAt: new Date().toISOString(),
  };

  uni.setStorageSync(SETUP_KEY, setup);
  uni.setStorageSync(PENDING_KEY, setup);
  uni.setStorageSync(ONBOARDING_KEY, '1');

  if (isRealUser()) {
    await updateOnboardingApi(setup);
    uni.removeStorageSync(PENDING_KEY);
  }
};

const finish = async () => {
  if (!canContinue.value || saving.value) {
    next();
    return;
  }

  saving.value = true;
  try {
    await persistSetup();
  } catch {
    uni.showToast({ title: '已保存本地设置，登录后会继续同步', icon: 'none' });
  } finally {
    saving.value = false;
  }

  if (!uni.getStorageSync('userId')) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }
  routeToNextStep();
};

const handlePrimary = () => {
  if (current.value < steps.length - 1) {
    next();
    return;
  }
  finish();
};
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
}

.top-safe-spacer {
  width: 100%;
  flex-shrink: 0;
}

.page-shell {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width, 640px);
  margin: 0 auto;
  padding: 16px 20px 0;
  box-sizing: border-box;
}

.hero {
  padding: 8px 0 18px;
}

.hero-kicker {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: var(--primary-color, #2563eb);
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.hero-title {
  display: block;
  font-size: 30px;
  line-height: 1.12;
  font-weight: 850;
  color: var(--text-primary, #0f172a);
}

.hero-desc {
  display: block;
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary, #64748b);
}

.progress-row {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.progress-dot {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: #dbe4f0;
}

.progress-dot.active,
.progress-dot.done {
  background: var(--primary-color, #2563eb);
}

.slides {
  width: 100%;
  height: 58vh;
  min-height: 430px;
}

.slide,
.slide-inner {
  width: 100%;
  height: 100%;
}

.slide-inner {
  display: flex;
  flex-direction: column;
}

.step-label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: var(--primary-color, #2563eb);
  margin-bottom: 8px;
}

.step-title {
  display: block;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.step-desc {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #64748b);
}

.option-grid,
.resume-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.choice-card,
.resume-card {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.choice-card.selected,
.resume-card.selected {
  border-color: var(--primary-color, #2563eb);
  background: rgba(37, 99, 235, 0.08);
}

.choice-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.choice-icon text,
.resume-icon {
  font-size: 22px;
}

.tone-blue { background: #dbeafe; color: #1d4ed8; }
.tone-green { background: #dcfce7; color: #15803d; }
.tone-amber { background: #fef3c7; color: #b45309; }
.tone-purple { background: #ede9fe; color: #6d28d9; }

.choice-copy,
.resume-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.choice-title,
.resume-title {
  font-size: 15px;
  line-height: 1.3;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.choice-desc,
.resume-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-secondary, #64748b);
}

.target-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 0 14px;
  height: 54px;
  box-sizing: border-box;
}

.target-icon {
  font-size: 22px;
  color: var(--primary-color, #2563eb);
}

.target-input {
  flex: 1;
  height: 52px;
  font-size: 16px;
  color: var(--text-primary, #0f172a);
}

.ph {
  color: var(--text-tertiary, #8e8e93);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.role-chip {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 999px;
  padding: 9px 12px;
  background: var(--surface-1, #ffffff);
}

.role-chip text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
}

.role-chip.selected {
  border-color: var(--primary-color, #2563eb);
  background: rgba(37, 99, 235, 0.1);
}

.role-chip.selected text {
  color: var(--primary-color, #2563eb);
}

.resume-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #2457d6;
  background: #dbeafe;
}

.route-preview {
  margin-top: 18px;
  border-left: 3px solid var(--primary-color, #2563eb);
  padding-left: 12px;
}

.route-label {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary, #8e8e93);
  margin-bottom: 4px;
}

.route-value {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.bottom-bar {
  width: 100%;
  max-width: var(--content-max-width, 640px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px 28px;
  box-sizing: border-box;
}
.btn-start-text { font-size: 17px; font-weight: 700; color: #ffffff; }

.btn-secondary,
.btn-primary {
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 800;
}

.btn-secondary {
  width: 112px;
  color: var(--text-secondary, #64748b);
  background: var(--surface-3, #f1f5f9);
}

.btn-secondary.invisible {
  display: none;
}

.btn-primary {
  flex: 1;
  color: #ffffff;
  background: var(--primary-color, #2563eb);
  box-shadow: var(--shadow-sm);
}

.btn-primary.disabled {
  opacity: 0.55;
}

.is-dark .hero-title,
.is-dark .step-title,
.is-dark .choice-title,
.is-dark .resume-title,
.is-dark .target-input,
.is-dark .route-value {
  color: #f8fafc;
}

.is-dark .hero-desc,
.is-dark .step-desc,
.is-dark .choice-desc,
.is-dark .resume-desc {
  color: #94a3b8;
}

.is-dark .choice-card.selected,
.is-dark .resume-card.selected {
  background: rgba(59, 130, 246, 0.16);
}

@media (max-height: 700px) {
  .hero-title { font-size: 26px; }
  .hero-desc { font-size: 13px; }
  .slides { min-height: 390px; }
  .option-grid,
  .resume-options { gap: 10px; margin-top: 16px; }
  .choice-card,
  .resume-card { padding: 12px; }
}
</style>
