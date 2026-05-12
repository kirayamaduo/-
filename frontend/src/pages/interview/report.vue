<template>
  <SlPage class="app-soft-bg" :custom-class="[themeClass, fontClass].join(' ')">
    <SlNavBar :title="t('interviewReport.navTitle')" show-back @back="goBack" :safe-top="topSafeHeight" />


    <!-- Loading state while AI evaluates -->
    <view class="loading-state app-surface" v-if="loading">
      <view class="spinner"></view>
      <text class="loading-title">{{ t('interviewReport.loading') }}</text>
      <text class="loading-sub">{{ t('interviewReport.loadingSub') }}</text>
    </view>

    <!-- Error state -->
    <view class="error-state app-surface" v-else-if="errorMsg">
      <text class="err-title">{{ t('interviewReport.errTitle') }}</text>
      <text class="err-detail">{{ errorMsg }}</text>
      <button class="btn-retry" @click="loadReport">{{ t('interviewReport.retry') }}</button>
    </view>

    <template v-else-if="report">
      <view class="report-header">
        <text class="r-title">{{ t('interviewReport.reportTitle') }}</text>
        <text class="r-sub">{{ report.positionName }} · {{ report.difficulty }}{{ report.durationSeconds ? ' · ' + formatDuration(report.durationSeconds) : '' }}</text>
        <text class="r-desc">{{ report.textSummary || 'Use the breakdown below to identify which parts of your interview performance are already stable and which ones still need practice.' }}</text>
      </view>

      <!-- Overall score -->
      <view class="score-card app-card-metric app-surface">
        <view class="score-ring-box">
          <view class="score-ring" :class="scoreRingClass">
            <text class="score-num" :class="scoreNumClass">{{ report.overallScore }}</text>
          </view>
          <text class="score-label">{{ t('interviewReport.overallScore') }}</text>
        </view>
        <view class="score-summary">
          <text class="score-eval" :class="scoreNumClass">{{ scoreLabel }}</text>
          <text class="score-desc">{{ t('interviewReport.questionsAnswered', { n: report.totalQuestions }) }}</text>
        </view>
      </view>

      <!-- Dimensions breakdown -->
      <view class="dims-section">
        <text class="section-title">{{ t('interviewReport.dimensionBreakdown') }}</text>
        <view class="dims-card app-card-soft app-surface">
          <view class="dim-row" v-for="(d, i) in dimensions" :key="i">
            <text class="dim-name">{{ d.name }}</text>
            <view class="dim-bar-bg">
              <view class="dim-bar-fill" :class="'bar-' + i" :style="{ width: d.score + '%' }"></view>
            </view>
            <text class="dim-score">{{ d.score }}</text>
          </view>
        </view>
      </view>

      <!-- Strengths -->
      <view class="advice-section" v-if="report.strengths && report.strengths.length">
        <text class="section-title">{{ t('interviewReport.strengths') }}</text>
        <view class="advice-card app-card-soft good app-surface" v-for="(a, i) in report.strengths" :key="'s' + i">
          <text class="advice-icon ri-check-line"></text>
          <view class="advice-body">
            <text class="advice-title">{{ a.title }}</text>
            <text class="advice-detail">{{ a.detail }}</text>
          </view>
        </view>
      </view>

      <!-- Improvements -->
      <view class="advice-section" v-if="report.improvements && report.improvements.length">
        <text class="section-title">{{ t('interviewReport.improvements') }}</text>
        <view class="advice-card app-card-soft warn app-surface" v-for="(a, i) in report.improvements" :key="'i' + i">
          <text class="advice-icon">!</text>
          <view class="advice-body">
            <text class="advice-title">{{ a.title }}</text>
            <text class="advice-detail">{{ a.detail }}</text>
          </view>
        </view>
      </view>

      <!-- Contribute to the question market -->
      <view class="advice-section">
        <text class="section-title">{{ t('interviewReport.helpOthers') }}</text>
        <view class="contribute-card app-card-soft app-surface">
          <text class="contribute-tip">{{ t('interviewReport.helpOthersTip') }}</text>
          <textarea
            class="contribute-input ui-input"
            v-model="contributeText"
            :maxlength="800"
            :placeholder="t('interviewReport.questionPlaceholder')"
          />
          <view class="contribute-actions">
            <button
              class="btn-secondary"
              @click="navTo('/pages/market/index?position=' + encodeURIComponent(report.positionName || ''))"
            >{{ t('interviewReport.browseMarket') }}</button>
            <button
              class="btn-primary"
              :disabled="contributing || !contributeText.trim()"
              @click="submitContribution"
            >{{ contributing ? t('market.sharing') : t('market.shareBtn') }}</button>
          </view>
        </view>
      </view>
    </template>

    <!-- Bottom action -->
    <view class="bottom-bar">
      <button class="btn-back" @click="backToLobby">{{ t('interviewReport.backToLobby') }}</button>
    </view>
  </SlPage>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { getInterviewReportApi, type InterviewReport } from '@/api/interview';
import { contributeQuestionApi } from '@/api/market';
import { useTheme } from '@/utils/theme';
import SlPage from '@/style-library/components/SlPage.vue';
import SlNavBar from '@/style-library/components/SlNavBar.vue';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafeHeight = ref(52);
const loading = ref(true);
const errorMsg = ref('');
const report = ref<InterviewReport | null>(null);
const interviewId = ref<number>(0);

const goBack = () => uni.navigateBack({ delta: 1 });

const dimensions = computed(() => {
  const r = report.value?.radarChart;
  if (!r) return [] as Array<{ name: string; score: number }>;
  const base: Array<{ name: string; score: number }> = [
    { name: 'Technical', score: r.technical },
    { name: 'Communication', score: r.communication },
    { name: 'Logic', score: r.logic },
    { name: 'Expression', score: r.expression },
    { name: 'Resilience', score: r.pressureResistance },
  ];
  // Sprint C-1: surface the 6th dimension only when the sidecar actually
  // collected frames. Null bodyLanguage means "text interview", we don't
  // want to plot a fake zero score against it.
  if (r.bodyLanguage != null) {
    base.push({ name: 'Body Language', score: r.bodyLanguage });
  }
  return base;
});

const scoreLabel = computed(() => {
  const s = report.value?.overallScore ?? 0;
  if (s >= 85) return 'Excellent';
  if (s >= 70) return t('interviewReport.scoreGood');
  if (s >= 55) return t('interviewReport.scoreFair');
  return t('interviewReport.scoreNeedsWork');
});

const scoreNumClass = computed(() => {
  const s = report.value?.overallScore ?? 0;
  if (s >= 70) return 'tone-good';
  if (s >= 55) return 'tone-warn';
  return 'tone-bad';
});

const scoreRingClass = computed(() => 'ring-' + scoreNumClass.value);

const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const loadReport = async () => {
  if (!interviewId.value) {
    errorMsg.value = t('interviewReport.missingInterviewId');
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    report.value = await getInterviewReportApi(interviewId.value);
  } catch (e: any) {
    errorMsg.value = e?.message || t('interviewReport.generateFailed');
  } finally {
    loading.value = false;
  }
};

const backToLobby = () => {
  uni.reLaunch({ url: '/pages/interview/index' });
};

const contributeText = ref('');
const contributing = ref(false);

const navTo = (url: string) => uni.navigateTo({ url });

const submitContribution = async () => {
  const trimmed = contributeText.value.trim();
  if (trimmed.length < 8) {
    uni.showToast({ title: t('market.addMoreWords'), icon: 'none' });
    return;
  }
  if (!report.value) return;
  contributing.value = true;
  try {
    await contributeQuestionApi({
      position: report.value.positionName || 'General',
      difficulty: report.value.difficulty || 'Normal',
      content: trimmed,
    });
    contributeText.value = '';
    uni.showToast({ title: t('market.shareSuccess'), icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('market.shareFailed'), icon: 'none' });
  } finally {
    contributing.value = false;
  }
};

onMounted(() => {
  refreshTheme();
  topSafeHeight.value = getMpSafeAreaMetrics().topSafeHeight;
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  interviewId.value = parseInt(currentPage.options?.interviewId || '0');
  loadReport();
});

onShow(() => {
  refreshTheme();
});
</script>

<style scoped>
.sl-page :deep(.report-container) {
  padding: 0 20px;
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.report-header { margin-bottom: 24px; padding: 0 20px; }

.r-title {
  font-size: 28px; font-weight: 800; color: #0f172a;
  letter-spacing: -0.5px; display: block; margin-bottom: 6px;
}

.r-sub { font-size: 13px; color: #94a3b8; }

.r-desc {
  display: block;
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}

/* Score card */
.score-card {
  padding: 28px 24px;
  display: flex; gap: 20px; align-items: center; margin-bottom: 28px; margin-left: 20px; margin-right: 20px;
}

.score-ring-box {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  flex-shrink: 0;
}

.score-ring {
  width: 80px; height: 80px; border-radius: 40px;
  border: 5px solid transparent;
  background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #22c55e, #16a34a);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  display: flex; justify-content: center; align-items: center;
}

.score-num { font-size: 28px; font-weight: 800; }
.score-num.tone-good { color: #15803d; }
.score-num.tone-warn { color: #b45309; }
.score-num.tone-bad  { color: #b91c1c; }

.ring-tone-good { background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #22c55e, #16a34a); }
.ring-tone-warn { background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #f59e0b, #d97706); }
.ring-tone-bad  { background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #ef4444, #dc2626); }

.score-label { font-size: 12px; color: #94a3b8; font-weight: 500; }

.score-summary { flex: 1; }

.score-eval {
  font-size: 20px; font-weight: 700;
  display: block; margin-bottom: 6px;
}
.score-eval.tone-good { color: #15803d; }
.score-eval.tone-warn { color: #b45309; }
.score-eval.tone-bad  { color: #b91c1c; }

.score-desc { font-size: 13px; color: #64748b; line-height: 1.5; }

.dims-section { margin-bottom: 28px; padding: 0 20px; }

.section-title {
  font-size: 18px; font-weight: 700; color: #0f172a;
  margin-bottom: 14px; display: block; letter-spacing: -0.3px;
}

.dims-card {
  padding: 20px;
}

.dim-row {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 18px;
}

.dim-row:last-child { margin-bottom: 0; }

.dim-name { width: 90px; font-size: 14px; font-weight: 600; color: #334155; }

.dim-bar-bg {
  flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;
}

.dim-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

.bar-0 { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bar-1 { background: linear-gradient(90deg, #10b981, #34d399); }
.bar-2 { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.bar-3 { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.dim-score { width: 28px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; }

/* Advice */
.advice-section { margin-bottom: 24px; padding: 0 20px; }

.advice-card {
  display: flex; gap: 14px; padding: 18px; margin-bottom: 12px;
}

.advice-icon {
  font-size: 16px; font-weight: 700; flex-shrink: 0;
  width: 28px; height: 28px; line-height: 28px; text-align: center;
  border-radius: 14px; color: #fff;
}
.advice-card.good .advice-icon { background: #22c55e; }
.advice-card.warn .advice-icon { background: #f59e0b; }

.loading-state, .error-state {
  background: #fff; border: 1px solid var(--border-color, #b8c8d8);
  border-radius: 20px; padding: 36px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  margin-top: 12px;
}
.loading-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.loading-sub { font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; }
.spinner {
  width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb;
  border-radius: 50%; animation: spin 0.9s linear infinite; margin-bottom: 8px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.err-title { font-size: 16px; font-weight: 700; color: #b91c1c; }
.err-detail { font-size: 13px; color: #64748b; text-align: center; line-height: 1.5; }
.btn-retry {
  margin-top: 8px; background: #2563eb; color: #fff;
  border: none; height: 40px; line-height: 40px;
  font-size: 14px; font-weight: 600; border-radius: 12px; padding: 0 20px;
}

.advice-body { flex: 1; }

.advice-title {
  font-size: 15px; font-weight: 600; color: #1e293b;
  display: block; margin-bottom: 6px;
}

.advice-detail { font-size: 13px; color: #64748b; line-height: 1.55; }

/* Bottom bar */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 16px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  background: rgba(245, 245, 247, 0.88);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.1); z-index: 100;
}

.btn-back {
  width: 100%; background: #2563eb; color: #ffffff;
  font-size: 16px; font-weight: 600; border-radius: 16px;
  height: 52px; line-height: 52px; border: none;
}

.btn-back:active { background: #1d4ed8; }

/* Phase 4 — contribute card */
.contribute-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.contribute-tip { font-size: 13px; line-height: 1.5; color: #64748b; }
.contribute-input {
  width: 100%;
  min-height: 88px;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #b8c8d8);
  border-radius: 12px;
  background: #f8fafc;
  font-size: 14px; line-height: 1.5;
  color: #0f172a;
  box-sizing: border-box;
}
.contribute-actions { display: flex; gap: 10px; }
.btn-secondary {
  flex: 1; height: 40px; line-height: 40px; padding: 0 14px;
  border-radius: 12px; font-size: 13px; font-weight: 600;
  background: #f1f5f9; color: #2563eb; border: 1px solid #e2e8f0;
}
.btn-primary {
  flex: 1; height: 40px; line-height: 40px; padding: 0 14px;
  border-radius: 12px; font-size: 13px; font-weight: 700;
  background: #2563eb; color: #fff; border: none;
}
.btn-primary[disabled] { opacity: 0.55; }

/* Dark mode */
.is-dark .r-title,
.is-dark .section-title,
.is-dark .dim-name,
.is-dark .dim-score,
.is-dark .advice-title { color: #f8fafc; }

.is-dark .score-card,
.is-dark .dims-card,
.is-dark .advice-card,
.is-dark .contribute-card { background: transparent; box-shadow: none; border-color: #334155; }
.is-dark .contribute-input { background: #0f172a; color: #f8fafc; border-color: #334155; }
.is-dark .contribute-tip { color: #94a3b8; }
.is-dark .btn-secondary { background: #1e293b; color: #93c5fd; border-color: #334155; }

.is-dark .score-desc,
.is-dark .r-desc,
.is-dark .advice-detail { color: #94a3b8; }

.is-dark .bottom-bar { background: rgba(15, 23, 42, 0.88); border-color: #334155; }
</style>
