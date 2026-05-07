<template>
  <view class="page" :class="[themeClass, fontClass]">
    <view class="status-bar" :style="{ height: topSafe + 'px' }"></view>

    <!-- Header -->
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="header-text">
        <text class="page-title">{{ t('resumeTemplate.pageTitle') }}</text>
        <text class="page-subtitle">{{ t('resumeTemplate.pageSubtitle') }}</text>
      </view>
    </view>

    <!-- Progress bar -->
    <view class="progress-track">
      <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
    </view>
    <text class="progress-label">{{ t('resumeTemplate.stepLabel', { step: currentStep, label: stepLabels[currentStep - 1] }) }}</text>

    <!-- ===== Step 1: Basic Info ===== -->
    <view v-show="currentStep === 1" class="step-body">
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldName') }} <text class="req">*</text></text>
        <input class="field-input" v-model="form.name" placeholder="e.g. Zhang Wei" />
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldPhone') }}</text>
        <input class="field-input" v-model="form.phone" type="number" placeholder="e.g. 138 0000 0000" />
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldEmail') }}</text>
        <input class="field-input" v-model="form.email" placeholder="your@email.com" />
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldTargetRole') }} <text class="req">*</text></text>
        <input class="field-input" v-model="form.targetRole" placeholder="e.g. Frontend Developer" />
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldCity') }}</text>
        <input class="field-input" v-model="form.city" placeholder="e.g. Beijing / Shanghai / Remote" />
      </view>
    </view>

    <!-- ===== Step 2: Education + Skills ===== -->
    <view v-show="currentStep === 2" class="step-body">
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldUniversity') }}</text>
        <input class="field-input" v-model="form.university" placeholder="e.g. Tsinghua University" />
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldMajor') }}</text>
        <input class="field-input" v-model="form.major" placeholder="e.g. Computer Science" />
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldDegree') }}</text>
        <picker mode="selector" :range="degreeOptions" @change="onDegreeChange">
          <view class="field-picker" :class="{ 'picker-filled': form.degree }">
            <text class="picker-text" :class="{ 'picker-text-filled': form.degree }">
              {{ form.degree || t('resumeTemplate.tapToSelect') }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldGradYear') }}</text>
        <picker mode="date" fields="year" @change="onYearChange">
          <view class="field-picker" :class="{ 'picker-filled': form.graduationYear }">
            <text class="picker-text" :class="{ 'picker-text-filled': form.graduationYear }">
              {{ form.graduationYear || t('resumeTemplate.tapToSelect') }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="field-group">
        <text class="field-label">{{ t('resumeTemplate.fieldSkills') }}</text>
        <input class="field-input" v-model="form.skills" placeholder="e.g. Vue3, Spring Boot, Python, SQL" />
      </view>
    </view>

    <!-- ===== Step 3: Experience ===== -->
    <view v-show="currentStep === 3" class="step-body">
      <view class="tip-card">
        <text class="tip-icon">💡</text>
        <text class="tip-text">{{ t('resumeTemplate.experienceTip') }}</text>
      </view>
      <view class="field-group">
        <view class="field-label-row">
          <text class="field-label">{{ t('resumeTemplate.fieldExperience') }}</text>
          <text class="char-count">{{ form.experience.length }} / 800</text>
        </view>
        <textarea
          class="field-textarea"
          v-model="form.experience"
          placeholder="Example: Developed a Vue3 + Spring Boot e-commerce platform. Responsible for the product listing and checkout modules. Reduced checkout time by 40% by optimising API calls..."
          maxlength="800"
          @input="(e: any) => form.experience = e.detail.value"
        />
      </view>
    </view>

    <!-- Bottom navigation -->
    <view class="bottom-bar">
      <view
        v-if="currentStep > 1"
        class="btn-back"
        @click="currentStep--"
      >
        <text class="btn-back-text">{{ t('resumeTemplate.backBtn') }}</text>
      </view>
      <view
        v-if="currentStep < 3"
        class="btn-next"
        :class="{ 'btn-disabled': !stepValid }"
        @click="nextStep"
      >
        <text class="btn-next-text">{{ t('resumeTemplate.nextBtn') }}</text>
      </view>
      <view
        v-if="currentStep === 3"
        class="btn-generate"
        :class="{ 'btn-disabled': submitting }"
        @click="handleGenerate"
      >
        <text class="btn-generate-text">{{ submitting ? t('resumeTemplate.generating') : t('resumeTemplate.generateBtn') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import { getTopSafeHeight } from '@/utils/safeArea';
import { generateResumeFromTemplateApi } from '@/api/resume';
import { useTheme } from '@/utils/theme';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafe = ref(getTopSafeHeight());
const submitting = ref(false);
const currentStep = ref(1);
const stepLabels = computed(() => [t('resumeTemplate.step1'), t('resumeTemplate.step2'), t('resumeTemplate.step3')]);
const degreeOptions = ['Associate', 'Bachelor', 'Master', 'Doctorate'];

const form = ref({
  name: '', phone: '', email: '', targetRole: '', city: '',
  university: '', major: '', degree: '', graduationYear: '', skills: '', experience: '',
});

const progressPct = computed(() => (currentStep.value / 3) * 100);
refreshTheme();

onShow(() => {
  refreshTheme();
  uni.setNavigationBarTitle({ title: t('resumeTemplate.pageTitle') });
});

const stepValid = computed(() => {
  if (currentStep.value === 1) return !!form.value.name.trim() && !!form.value.targetRole.trim();
  return true;
});

const nextStep = () => {
  if (!stepValid.value) {
    uni.showToast({ title: t('resumeTemplate.requiredError'), icon: 'none' });
    return;
  }
  currentStep.value++;
};

const goBack = () => {
  uni.navigateBack();
};

const onDegreeChange = (e: any) => { form.value.degree = degreeOptions[e.detail.value]; };
const onYearChange = (e: any) => { form.value.graduationYear = e.detail.value; };

const handleGenerate = async () => {
  if (!form.value.name.trim() || !form.value.targetRole.trim()) {
    uni.showToast({ title: t('resumeTemplate.requiredError'), icon: 'none' });
    currentStep.value = 1;
    return;
  }
  const userId = Number(uni.getStorageSync('userId'));
  if (!userId || isNaN(userId) || userId <= 0) {
    uni.showToast({ title: t('resumeTemplate.loginRequired'), icon: 'none' });
    return;
  }
  submitting.value = true;
  uni.showLoading({ title: 'AI writing your resume…', mask: true });
  try {
    await generateResumeFromTemplateApi({ userId, ...form.value });
    uni.hideLoading();
    uni.showToast({ title: 'Resume created!', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1200);
  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: e?.message || 'Generation failed', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f2f2f7;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* ── Header ── */
.status-bar { width: 100%; }

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px 16px;
}

.back-btn {
  width: 36px; height: 36px; border-radius: 18px;
  background: rgba(0, 0, 0, 0.06);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.back-btn:active { background: rgba(0, 0, 0, 0.12); }
.back-icon { font-size: 24px; color: #1e293b; font-weight: 600; line-height: 1; }

.header-text { flex: 1; }
.page-title { display: block; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
.page-subtitle { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }

/* ── Progress ── */
.progress-track {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 0 20px;
}
.progress-fill {
  height: 4px;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  border-radius: 2px;
  transition: width 0.35s ease;
}
.progress-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  margin: 6px 20px 16px;
  letter-spacing: 0.03em;
}

/* ── Step body ── */
.step-body {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Fields ── */
.field-group { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  padding-left: 2px;
}
.req { color: #ef4444; }

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.char-count { font-size: 11px; color: #94a3b8; }

.field-input {
  height: 48px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 15px;
  color: #0f172a;
  box-sizing: border-box;
  width: 100%;
}
.field-input:focus { border-color: #2563eb; }

.field-picker {
  height: 48px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}
.picker-filled { border-color: #c7d2fe; }
.picker-text { font-size: 15px; color: #94a3b8; flex: 1; }
.picker-text-filled { color: #0f172a; }
.picker-arrow { font-size: 18px; color: #c7c7cc; }

.field-textarea {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  color: #0f172a;
  line-height: 1.55;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
}

/* ── Tip card ── */
.tip-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 12px 14px;
}
.tip-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.tip-text { font-size: 12.5px; color: #1e40af; line-height: 1.5; flex: 1; }

/* ── Bottom navigation ── */
.bottom-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  background: rgba(242, 242, 247, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.12);
  display: flex;
  gap: 10px;
  z-index: 10;
}

.btn-back {
  height: 52px;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  padding: 0 20px;
}
.btn-back:active { background: #f1f5f9; }
.btn-back-text { font-size: 15px; color: #475569; font-weight: 600; }

.btn-next {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  background: #2563eb;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
.btn-next:active { background: #1d4ed8; }
.btn-next-text { font-size: 16px; color: #ffffff; font-weight: 700; }

.btn-generate {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
}
.btn-generate:active { opacity: 0.88; }
.btn-generate-text { font-size: 16px; color: #ffffff; font-weight: 700; }

.btn-disabled {
  background: #e2e8f0 !important;
  box-shadow: none !important;
}
.btn-disabled .btn-next-text,
.btn-disabled .btn-generate-text { color: #94a3b8 !important; }

/* ── Dark mode ── */
.is-dark { background: #0f172a; }
.is-dark .back-btn { background: rgba(255, 255, 255, 0.1); }
.is-dark .back-icon,
.is-dark .page-title { color: #f8fafc; }
.is-dark .progress-track { background: #1e293b; }
.is-dark .field-label { color: #cbd5e1; }
.is-dark .field-input,
.is-dark .field-picker,
.is-dark .field-textarea {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}
.is-dark .picker-text-filled { color: #f8fafc; }
.is-dark .tip-card { background: rgba(37, 99, 235, 0.12); border-color: #1e40af; }
.is-dark .tip-text { color: #93c5fd; }
.is-dark .bottom-bar { background: rgba(15, 23, 42, 0.95); border-color: #334155; }
.is-dark .btn-back { background: #1e293b; border-color: #334155; }
.is-dark .btn-back-text { color: #94a3b8; }
</style>
