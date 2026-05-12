<template>
  <SlPage class="profile-page app-soft-bg" :custom-class="[themeClass, fontClass].join(' ')">
    <SlNavBar
      :title="t('agent.profile.title')"
      show-back
      @back="goBack"
      :safe-top="topSafeHeight"
      :right-avoid-width="rightAvoidWidth"
    />

    <!-- completeness banner -->
    <view v-if="agentProfile" class="profile-banner">
      <view class="profile-banner-bar-wrap">
        <view
          class="profile-banner-bar-fill"
          :class="'pct-' + agentProfile.personalizationLevel.toLowerCase()"
          :style="{ width: agentProfile.completenessScore + '%' }"
        ></view>
      </view>
      <text class="profile-banner-label">
        {{ t('agent.profile.completeness', { n: agentProfile.completenessScore }) }}
        （{{ levelLabel }}）
      </text>
    </view>

    <!-- form -->
    <view class="profile-form">
      <view class="profile-section app-card-soft">
        <text class="profile-section-title">{{ t('agent.profile.sectionGoal') }}</text>

        <view class="profile-field">
          <text class="profile-label">{{ t('agent.profile.targetCity') }}</text>
          <input
            v-model="form.targetCity"
            class="profile-input ui-input"
            :placeholder="t('agent.profile.targetCityPlaceholder')"
            maxlength="30"
          />
        </view>

        <view class="profile-field">
          <text class="profile-label">{{ t('agent.profile.targetIndustry') }}</text>
          <input
            v-model="form.targetIndustry"
            class="profile-input ui-input"
            :placeholder="t('agent.profile.targetIndustryPlaceholder')"
            maxlength="30"
          />
        </view>

        <view class="profile-field">
          <text class="profile-label">{{ t('agent.profile.timeline') }}</text>
          <view class="profile-chips">
            <view
              v-for="opt in timelineOptions"
              :key="opt.val"
              class="profile-chip ui-list-item"
              :class="{ 'profile-chip-active': form.timeline === opt.val }"
              @click="form.timeline = opt.val"
            >
              <text class="profile-chip-text">{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <view class="profile-field">
          <text class="profile-label">{{ t('agent.profile.careerGoalNote') }}</text>
          <textarea
            v-model="form.careerGoalNote"
            class="profile-textarea ui-input"
            :placeholder="t('agent.profile.careerGoalNotePlaceholder')"
            maxlength="200"
          />
        </view>
      </view>

      <view class="profile-section app-card-soft">
        <text class="profile-section-title">{{ t('agent.profile.sectionLearning') }}</text>

        <view class="profile-field">
          <text class="profile-label">{{ t('agent.profile.weeklyHours') }}</text>
          <view class="profile-chips">
            <view
              v-for="opt in weeklyOptions"
              :key="opt.val"
              class="profile-chip ui-list-item"
              :class="{ 'profile-chip-active': form.weeklyHours === opt.val }"
              @click="form.weeklyHours = opt.val"
            >
              <text class="profile-chip-text">{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <view class="profile-field">
          <text class="profile-label">{{ t('agent.profile.difficulty') }}</text>
          <view class="profile-chips">
            <view
              v-for="opt in difficultyOptions"
              :key="opt.val"
              class="profile-chip ui-list-item"
              :class="{ 'profile-chip-active': form.preferredDifficulty === opt.val }"
              @click="form.preferredDifficulty = opt.val"
            >
              <text class="profile-chip-text">{{ opt.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="profile-section app-card-soft">
        <text class="profile-section-title">{{ t('agent.profile.sectionStudy') }}</text>
        <view class="profile-toggle-row">
          <text class="profile-label">{{ t('agent.profile.gradSchool') }}</text>
          <view class="profile-toggle-group">
            <view
              class="profile-toggle-btn ui-list-item"
              :class="{ 'profile-toggle-active': form.considerGradSchool === true }"
              @click="form.considerGradSchool = true"
            ><text class="profile-toggle-text">{{ t('agent.profile.yes') }}</text></view>
            <view
              class="profile-toggle-btn ui-list-item"
              :class="{ 'profile-toggle-active': form.considerGradSchool === false }"
              @click="form.considerGradSchool = false"
            ><text class="profile-toggle-text">{{ t('agent.profile.no') }}</text></view>
          </view>
        </view>
        <view class="profile-toggle-row">
          <text class="profile-label">{{ t('agent.profile.studyAbroad') }}</text>
          <view class="profile-toggle-group">
            <view
              class="profile-toggle-btn ui-list-item"
              :class="{ 'profile-toggle-active': form.considerStudyAbroad === true }"
              @click="form.considerStudyAbroad = true"
            ><text class="profile-toggle-text">{{ t('agent.profile.yes') }}</text></view>
            <view
              class="profile-toggle-btn ui-list-item"
              :class="{ 'profile-toggle-active': form.considerStudyAbroad === false }"
              @click="form.considerStudyAbroad = false"
            ><text class="profile-toggle-text">{{ t('agent.profile.no') }}</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- submit -->
    <view class="profile-submit-wrap">
      <view
        class="profile-submit-btn"
        :class="{ 'profile-submit-loading': saving }"
        @click="saveInputs"
      >
        <text class="profile-submit-text">{{ saving ? t('agent.profile.saving') : t('agent.profile.save') }}</text>
      </view>
    </view>
  </SlPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/locales';
import SlNavBar from '@/style-library/components/SlNavBar.vue';
import SlPage from '@/style-library/components/SlPage.vue';
import { getAgentProfileApi, saveProfileInputsApi, type AgentUserProfile, type ProfileInputsRequest } from '@/api/agent';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();

const topSafeHeight = ref(52);
const rightAvoidWidth = ref(16);
const agentProfile = ref<AgentUserProfile | null>(null);
const saving = ref(false);

const form = ref<ProfileInputsRequest>({
  targetCity: '',
  targetIndustry: '',
  timeline: '',
  weeklyHours: '',
  preferredDifficulty: '',
  considerGradSchool: undefined,
  considerStudyAbroad: undefined,
  careerGoalNote: '',
});

const timelineOptions = computed(() => [
  { label: t('agent.profile.timeline1m'), val: '1个月' },
  { label: t('agent.profile.timeline3m'), val: '3个月' },
  { label: t('agent.profile.timeline6m'), val: '6个月' },
  { label: t('agent.profile.timelineFull'), val: '校招季' },
  { label: t('agent.profile.timelineUnknown'), val: '不确定' },
]);

const weeklyOptions = computed(() => [
  { label: t('agent.profile.weeklyHoursLt5'), val: '3' },
  { label: t('agent.profile.weeklyHours5to10'), val: '7' },
  { label: t('agent.profile.weeklyHours10to20'), val: '15' },
  { label: t('agent.profile.weeklyHoursGt20'), val: '25' },
]);

const difficultyOptions = computed(() => [
  { label: t('agent.profile.difficultyEasy'), val: 'EASY' },
  { label: t('agent.profile.difficultyMedium'), val: 'MEDIUM' },
  { label: t('agent.profile.difficultyHard'), val: 'HARD' },
]);

const levelLabel = computed(() => {
  const lvl = agentProfile.value?.personalizationLevel || 'LOW';
  if (lvl === 'HIGH') return t('agent.profile.levelHigh');
  if (lvl === 'MEDIUM') return t('agent.profile.levelMedium');
  return t('agent.profile.levelLow');
});

onMounted(async () => {
  refreshTheme();
  const safeMetrics = getMpSafeAreaMetrics();
  topSafeHeight.value = safeMetrics.topSafeHeight;
  rightAvoidWidth.value = safeMetrics.rightAvoidWidth;
  try {
    agentProfile.value = await getAgentProfileApi();
  } catch { /* ignore */ }
});

const saveInputs = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    const payload: ProfileInputsRequest = {};
    if (form.value.targetCity?.trim()) payload.targetCity = form.value.targetCity.trim();
    if (form.value.targetIndustry?.trim()) payload.targetIndustry = form.value.targetIndustry.trim();
    if (form.value.timeline) payload.timeline = form.value.timeline;
    if (form.value.weeklyHours) payload.weeklyHours = form.value.weeklyHours;
    if (form.value.preferredDifficulty) payload.preferredDifficulty = form.value.preferredDifficulty;
    if (form.value.considerGradSchool !== undefined) payload.considerGradSchool = form.value.considerGradSchool;
    if (form.value.considerStudyAbroad !== undefined) payload.considerStudyAbroad = form.value.considerStudyAbroad;
    if (form.value.careerGoalNote?.trim()) payload.careerGoalNote = form.value.careerGoalNote.trim();

    agentProfile.value = await saveProfileInputsApi(payload);
    uni.showToast({ title: t('agent.profile.saveSuccess'), icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('agent.profile.saveFailed'), icon: 'none' });
  } finally {
    saving.value = false;
  }
};

const goBack = () => uni.navigateBack();
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--surface-1, #ffffff);
  padding-bottom: 120rpx;
}
.profile-banner {
  margin: 16rpx 28rpx;
  background: linear-gradient(135deg, #1d4ed8 0%, #6366f1 100%);
  border-radius: 18rpx;
  padding: 20rpx 24rpx;
}
.profile-banner-bar-wrap {
  height: 8rpx; background: rgba(255,255,255,.25); border-radius: 4rpx; overflow: hidden; margin-bottom: 10rpx;
}
.profile-banner-bar-fill {
  height: 100%; border-radius: 4rpx; transition: width .4s ease;
}
.pct-low    { background: #94a3b8; }
.pct-medium { background: #38bdf8; }
.pct-high   { background: #34d399; }
.profile-banner-label { font-size: 12px; color: rgba(255,255,255,.85); }

.profile-form { padding: 16rpx 28rpx; display: flex; flex-direction: column; gap: 20rpx; }
.profile-section {
  padding: 24rpx; margin-bottom: 24rpx;
  display: flex; flex-direction: column; gap: 20rpx;
}
.profile-section-title {
  font-size: 13px; font-weight: 700; color: var(--text-secondary, #64748b);
  border-left: 4rpx solid #1d4ed8; padding-left: 10rpx;
}
.profile-field { display: flex; flex-direction: column; gap: 8rpx; }
.profile-label { font-size: 12.5px; color: var(--text-secondary, #64748b); }
.profile-input {
  border: 1.5rpx solid #e5e7eb;
  border-radius: 10rpx;
  padding: 14rpx 16rpx;
  font-size: 13.5px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-2, #f8fafc);
}
.profile-textarea {
  border: 1.5rpx solid #e5e7eb;
  border-radius: 10rpx;
  padding: 14rpx 16rpx;
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-2, #f8fafc);
  height: 120rpx;
}
.profile-chips { display: flex; flex-wrap: wrap; gap: 10rpx; }
.profile-chip {
  border: 1.5rpx solid #d1d5db;
  border-radius: 999rpx;
  padding: 8rpx 18rpx;
  background: var(--surface-2, #f8fafc);
}
.profile-chip-active {
  border-color: var(--primary-hover, #1d4ed8);
  background: var(--primary-soft, #eff6ff);
}
.profile-chip-text { font-size: 12.5px; color: var(--text-secondary, #64748b); }
.profile-chip-active .profile-chip-text { color: var(--primary-hover, #1d4ed8); font-weight: 700; }

.profile-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
}
.profile-toggle-group { display: flex; gap: 10rpx; }
.profile-toggle-btn {
  border: 1.5rpx solid #d1d5db;
  border-radius: 999rpx;
  padding: 8rpx 22rpx;
  background: var(--surface-2, #f8fafc);
}
.profile-toggle-active {
  border-color: var(--primary-hover, #1d4ed8); background: var(--primary-soft, #eff6ff);
}
.profile-toggle-text { font-size: 12.5px; color: var(--text-secondary, #64748b); }
.profile-toggle-active .profile-toggle-text { color: var(--primary-hover, #1d4ed8); font-weight: 700; }

.profile-submit-wrap {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 20rpx 28rpx calc(32rpx + env(safe-area-inset-bottom, 0px));
  background: var(--surface-1, #ffffff);
  border-top: 1rpx solid #f1f5f9;
}
.profile-submit-btn {
  background: linear-gradient(135deg, #1d4ed8 0%, #6366f1 100%);
  border-radius: 999rpx;
  padding: 26rpx 0;
  text-align: center;
}
.profile-submit-loading { opacity: .65; }
.profile-submit-text { font-size: 15px; font-weight: 700; color: #fff; }
</style>
