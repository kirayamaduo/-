<template>
  <view class="resume-ai-container" :class="[themeClass, fontClass]">
    <view class="status-spacer" :style="{ height: topSafeHeight + 'px' }"></view>

    <view class="top-bar">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
    </view>

    <view class="header">
      <text class="title">{{ t('resumeAi.title') }}</text>
      <text class="subtitle">{{ t('resumeAi.subtitle') }}</text>
    </view>

    <view class="card">
      <view class="section">
        <text class="section-title">{{ t('resumeAi.resumeLabel') }}</text>
        <view class="select-box" :class="{ 'has-value': !!selectedResume }" @click="selectResume">
          <view class="s-icon-wrap"><text class="s-icon-text">PDF</text></view>
          <text class="s-text">{{ selectedResume || t('resumeAi.chooseResume') }}</text>
          <text class="s-chevron">›</text>
        </view>
      </view>

      <view class="section">
        <view class="jd-header">
          <text class="section-title">{{ t('resumeAi.jdLabel') }}</text>
          <text class="jd-counter" :class="{ 'jd-counter-warn': jdText.length > 4000 }">
            {{ jdText.length }} / 4000
          </text>
        </view>
        <textarea
          class="jd-input"
          v-model="jdText"
          :maxlength="4000"
          :placeholder="t('resumeAi.jdPlaceholder')"
          placeholder-class="ph"
        ></textarea>
      </view>

      <button class="btn-primary" :loading="analyzing" @click="startAnalysis">
        {{ t('resumeAi.analyzeBtn') }}
      </button>
    </view>

    <!-- Loading overlay (shared by Analyze and Tailor flows) -->
    <view class="loading-overlay" v-if="analyzing || tailoring">
      <view class="spinner"></view>
      <text class="loading-text">{{ loadingMessage }}</text>
      <view class="progress-bar-container">
        <view class="progress-bar-fill" :style="{ width: loadingProgress + '%' }"></view>
      </view>
    </view>

    <view class="result-card" v-if="showResult && result">
      <view class="r-header">
        <view class="r-title-wrap">
          <text class="r-title">{{ t('resumeAi.matchScore') }}</text>
          <text class="r-sub">{{ t('resumeAi.vsJobDesc') }}</text>
        </view>
        <view class="score-ring" :class="scoreClass">
          <text class="score-val">{{ result.overallScore }}</text>
        </view>
      </view>

      <view class="r-body">
        <view class="point-block strengths" v-if="result.strengths && result.strengths.length">
          <text class="point-title">{{ t('resumeAi.strengths') }}</text>
          <view class="point-list">
            <text class="point-text" v-for="(s, i) in result.strengths" :key="'s'+i">{{ s }}</text>
          </view>
        </view>

        <view class="point-block weaknesses" v-if="result.weaknesses && result.weaknesses.length">
          <text class="point-title">{{ t('resumeAi.weaknesses') }}</text>
          <view class="point-list">
            <text class="point-text" v-for="(w, i) in result.weaknesses" :key="'w'+i">{{ w }}</text>
          </view>
        </view>

        <view class="point-block suggestions" v-if="result.suggestions && result.suggestions.length">
          <text class="point-title">{{ t('resumeAi.suggestions') }}</text>
          <view class="point-list">
            <text class="point-text" v-for="(g, i) in result.suggestions" :key="'g'+i">{{ g }}</text>
          </view>
        </view>
      </view>

      <button class="btn-secondary" :loading="tailoring" @click="generateTailored">{{ t('resumeAi.tailorBtn') }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import { getTopSafeHeight } from '@/utils/safeArea';
import {
  getUserResumesApi,
  diagnoseResumeApi,
  tailorResumeApi,
  type Resume,
  type DiagnosisResult,
} from '@/api/resume';
import { getProfileSnapshotApi } from '@/api/user';
import { useTheme } from '@/utils/theme';

const selectedResume = ref('');
const selectedResumeId = ref<number | null>(null);
const userResumes = ref<Resume[]>([]);
const jdText = ref('');
const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafeHeight = ref(44);
const analyzing = ref(false);
const tailoring = ref(false);
const showResult = ref(false);
const result = ref<DiagnosisResult | null>(null);
const loadingMessage = ref('Ready...');
const loadingProgress = ref(0);

const scoreClass = computed(() => {
  const s = result.value?.overallScore ?? 0;
  if (s >= 80) return 'ring-good';
  if (s >= 60) return 'ring-warn';
  return 'ring-bad';
});

const goBack = () => {
  uni.navigateBack({ delta: 1 });
};

const loadResumes = async () => {
  const userId = Number(uni.getStorageSync('userId'));
  if (!userId || isNaN(userId) || userId <= 0) return;
  try {
    const raw = await getUserResumesApi(userId);
    userResumes.value = Array.isArray(raw) ? raw : [];
  } catch {
    userResumes.value = [];
  }
};

/**
 * Auto-pick the user's most recent resume so they don't have to tap into
 * the picker on every visit. Only applies when nothing is selected yet —
 * if the user explicitly chose a different one, we leave that alone.
 * Also drops a JD placeholder hint based on their assessment-suggested role
 * so the empty textarea isn't a blank wall to fill.
 */
const applyPrefill = async () => {
  jdPlaceholder.value = t('resumeAi.jdPlaceholder');
  try {
    const snap = await getProfileSnapshotApi();
    const lastResumeId = snap?.resume?.lastResumeId;
    if (lastResumeId && !selectedResumeId.value) {
      const match = userResumes.value.find((r) => r.resumeId === lastResumeId);
      if (match) {
        selectedResumeId.value = match.resumeId!;
        selectedResume.value = match.title || `Resume #${match.resumeId}`;
      }
    }
  } catch {
    // Snapshot is best-effort.
  }
};

const jdPlaceholder = ref('');

const selectResume = () => {
  if (!userResumes.value.length) {
    uni.showToast({ title: t('resume.noResumes'), icon: 'none' });
    return;
  }
  const itemList = userResumes.value.map(
    (r) => r.title || r.fileUrl?.split('/').pop() || `Resume #${r.resumeId}`
  );
  uni.showActionSheet({
    itemList,
    success: (res) => {
      const r = userResumes.value[res.tapIndex];
      if (r && r.resumeId) {
        selectedResume.value = itemList[res.tapIndex];
        selectedResumeId.value = r.resumeId;
      }
    },
  });
};

let progressTimers: number[] = [];
const clearProgressTimers = () => {
  progressTimers.forEach((t) => clearTimeout(t));
  progressTimers = [];
};

const runProgressAnimation = () => {
  loadingProgress.value = 0;
  loadingMessage.value = t('resumeAi.progressConnecting');
  clearProgressTimers();
  progressTimers = [
    setTimeout(() => { loadingMessage.value = t('resumeAi.progressParsing'); loadingProgress.value = 22; }, 400) as unknown as number,
    setTimeout(() => { loadingMessage.value = t('resumeAi.progressComparing'); loadingProgress.value = 55; }, 1500) as unknown as number,
    setTimeout(() => { loadingMessage.value = t('resumeAi.progressInsights'); loadingProgress.value = 82; }, 3500) as unknown as number,
  ];
};

// Tailoring is a longer pipeline (AI rewrite -> HTML -> PDF -> OSS upload).
// Total typical duration is 30-90s, so we crawl progress slowly and cap at
// 92% until the API actually returns, then snap to 100%.
const runTailorProgress = () => {
  loadingProgress.value = 0;
  loadingMessage.value = t('resumeAi.progressPrep');
  clearProgressTimers();
  const stages: Array<{ at: number; pct: number; msgKey: string }> = [
    { at: 800,    pct: 8,  msgKey: 'resumeAi.progressReading' },
    { at: 2500,   pct: 18, msgKey: 'resumeAi.progressExtracting' },
    { at: 5000,   pct: 32, msgKey: 'resumeAi.progressRewriting' },
    { at: 15000,  pct: 52, msgKey: 'resumeAi.progressRewriting' },
    { at: 30000,  pct: 70, msgKey: 'resumeAi.progressPolishing' },
    { at: 50000,  pct: 82, msgKey: 'resumeAi.progressRendering' },
    { at: 75000,  pct: 90, msgKey: 'resumeAi.progressUploading' },
    { at: 100000, pct: 92, msgKey: 'resumeAi.progressAlmost' },
  ];
  progressTimers = stages.map(
    (s) =>
      setTimeout(() => {
        loadingMessage.value = t(s.msgKey);
        loadingProgress.value = s.pct;
      }, s.at) as unknown as number
  );
};

const startAnalysis = async () => {
  if (!selectedResumeId.value) {
    uni.showToast({ title: t('resumeAi.selectResumeFirst'), icon: 'none' });
    return;
  }
  if (!jdText.value || !jdText.value.trim()) {
    uni.showToast({ title: t('resumeAi.pasteJdFirst'), icon: 'none' });
    return;
  }

  analyzing.value = true;
  showResult.value = false;
  result.value = null;
  runProgressAnimation();

  try {
    const res = await diagnoseResumeApi({
      resumeId: selectedResumeId.value,
      jobDescription: jdText.value.trim(),
    });
    loadingProgress.value = 100;
    loadingMessage.value = t('common.success');
    result.value = res;
    showResult.value = true;
    uni.showToast({ title: t('resumeAi.diagnosisComplete'), icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: t('resumeAi.diagnosisFailed'), icon: 'none' });
  } finally {
    progressTimers.forEach((t) => clearTimeout(t));
    analyzing.value = false;
  }
};

const generateTailored = async () => {
  if (!selectedResumeId.value) {
    uni.showToast({ title: t('resumeAi.selectResumeFirst'), icon: 'none' });
    return;
  }
  const userId = Number(uni.getStorageSync('userId'));
  if (!userId) {
    uni.showToast({ title: t('login.wechatLogin'), icon: 'none' });
    return;
  }
  tailoring.value = true;
  runTailorProgress();
  try {
    await tailorResumeApi({
      userId,
      resumeId: selectedResumeId.value,
      jobDescription: jdText.value.trim(),
    });
    clearProgressTimers();
    loadingProgress.value = 100;
    loadingMessage.value = t('common.success');
    uni.showToast({ title: t('resumeAi.tailorComplete'), icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/resume/index' }), 900);
  } catch (e: any) {
    uni.showToast({ title: t('resumeAi.tailorFailed'), icon: 'none' });
  } finally {
    clearProgressTimers();
    tailoring.value = false;
  }
};

onMounted(async () => {
  refreshTheme();
  topSafeHeight.value = getTopSafeHeight();
  await loadResumes();
  await applyPrefill();
});

onShow(() => {
  refreshTheme();
});
</script>

<style scoped>
.resume-ai-container {
  min-height: 100vh;
  background-color: #f5f5f7;
  padding: 0 20px 60px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  box-sizing: border-box;
}

.status-spacer { width: 100%; }

.top-bar { padding: 4px 0 8px; }
.back-btn {
  width: 36px; height: 36px;
  border-radius: 18px;
  background: rgba(255,255,255,0.85);
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.back-btn:active { background: #f1f5f9; }
.back-icon { font-size: 22px; font-weight: 400; line-height: 1; color: #1e293b; margin-top: -2px; }

.header { margin-bottom: 20px; }

.title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  display: block;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  display: block;
}

.card {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 24px 20px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}

.section { margin-bottom: 24px; }

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  display: block;
}

.select-box {
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xs);
}

.select-box:active { background-color: #f1f5f9; }

.s-icon-wrap {
  width: 36px; height: 44px;
  border-radius: 8px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  display: flex; align-items: center; justify-content: center;
  margin-right: 12px; flex-shrink: 0;
}
.s-icon-text { font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; }

.s-text {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: #94a3b8;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
}
.select-box.has-value .s-text { color: #0f172a; font-weight: 500; }

.s-chevron {
  font-size: 22px;
  color: #cbd5e1;
  font-weight: 400;
  line-height: 1;
  flex-shrink: 0;
}

/* Header row with the live character counter on the right.
   Helps the user judge if they've pasted enough JD context for a useful diagnosis. */
.jd-header {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 8px;
}
.jd-counter {
  font-size: 11px; font-weight: 600;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.jd-counter-warn { color: #f59e0b; }

.jd-input {
  width: 100%;
  height: 160px;
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
  font-size: 15px;
  color: #334155;
  border: 1px solid var(--border-color);
  line-height: 1.5;
}

.ph { color: #94a3b8; }

/* WeChat <button> defaults to white bg with a ::after pseudo border.
   Use solid hex (gradients on button are unreliable on mp-weixin) and
   reset the ::after border so our background actually shows through. */
.btn-primary {
  background-color: #2563eb !important;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  font-size: 16px;
  font-weight: 600;
  border-radius: 14px;
  height: 52px;
  line-height: 52px;
  border: none;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
  margin-top: 4px;
}
.btn-primary::after { border: none; }
.btn-primary[disabled] { background-color: #94a3b8 !important; color: #ffffff !important; }
.btn-primary:active { opacity: 0.92; }

.result-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 22px 18px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.r-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.r-title-wrap { display: flex; flex-direction: column; gap: 2px; }
.r-title { font-size: 18px; font-weight: 700; color: #0f172a; }
.r-sub { font-size: 12px; color: #94a3b8; }

.score-ring {
  width: 76px; height: 76px;
  border-radius: 38px;
  border: 5px solid #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ecfdf5;
  flex-shrink: 0;
}
.score-ring.ring-good { border-color: #10b981; background: #ecfdf5; }
.score-ring.ring-good .score-val { color: #047857; }
.score-ring.ring-warn { border-color: #f59e0b; background: #fffbeb; }
.score-ring.ring-warn .score-val { color: #b45309; }
.score-ring.ring-bad  { border-color: #ef4444; background: #fef2f2; }
.score-ring.ring-bad  .score-val { color: #b91c1c; }

.score-val { font-size: 26px; font-weight: 800; line-height: 1; }

.r-body { margin-bottom: 20px; display: flex; flex-direction: column; gap: 14px; }

.point-block {
  border-left: 3px solid #cbd5e1;
  padding: 4px 0 4px 12px;
}
.point-block.strengths { border-left-color: #10b981; }
.point-block.weaknesses { border-left-color: #ef4444; }
.point-block.suggestions { border-left-color: #6366f1; }

.point-title { font-size: 13px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: #475569; margin-bottom: 8px; display: block; }
.point-block.strengths .point-title { color: #047857; }
.point-block.weaknesses .point-title { color: #b91c1c; }
.point-block.suggestions .point-title { color: #4338ca; }

.point-list { display: flex; flex-direction: column; gap: 6px; }
.point-text { font-size: 14px; color: #334155; line-height: 1.55; display: block; }

.btn-secondary {
  background-color: #eff6ff !important;
  color: #2563eb !important;
  font-size: 15px;
  font-weight: 600;
  border-radius: 14px;
  height: 48px;
  line-height: 48px;
  border: none;
}

.btn-secondary::after { border: none; }
.btn-secondary:active { background-color: #dbeafe !important; }

.loading-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #eff6ff;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text { font-size: 16px; font-weight: 600; color: #1e293b; }

.progress-bar-container {
  width: 220px;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  margin-top: 16px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #2563eb;
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.is-dark { background-color: #0f172a; }

.is-dark .title,
.is-dark .section-title,
.is-dark .r-title,
.is-dark .point-title,
.is-dark .loading-text { color: #f8fafc; }

.is-dark .subtitle,
.is-dark .point-text,
.is-dark .s-text { color: #94a3b8; }

.is-dark .card,
.is-dark .result-card,
.is-dark .select-box,
.is-dark .jd-input { background-color: #1e293b; border-color: #334155; }

.is-dark .loading-overlay { background: rgba(15, 23, 42, 0.88); }

.is-dark .back-text,
.is-dark .back-icon { color: #60a5fa; }

.is-dark .score-ring { background-color: #1e293b; }
.is-dark .score-ring.ring-good { border-color: #10b981; background: #022c22; }
.is-dark .score-ring.ring-good .score-val { color: #34d399; }
.is-dark .score-ring.ring-warn { border-color: #f59e0b; background: #451a03; }
.is-dark .score-ring.ring-warn .score-val { color: #fbbf24; }
.is-dark .score-ring.ring-bad { border-color: #ef4444; background: #450a0a; }
.is-dark .score-ring.ring-bad .score-val { color: #f87171; }
.is-dark .point-block { border-left-color: #475569; }
.is-dark .point-block.strengths { border-left-color: #10b981; }
.is-dark .point-block.strengths .point-title { color: #34d399; }
.is-dark .point-block.weaknesses { border-left-color: #ef4444; }
.is-dark .point-block.weaknesses .point-title { color: #f87171; }
.is-dark .point-block.suggestions { border-left-color: #6366f1; }
.is-dark .point-block.suggestions .point-title { color: #818cf8; }
.is-dark .point-title { color: #94a3b8; }
.is-dark .point-text { color: #cbd5e1; }
.is-dark .btn-secondary { background: rgba(37, 99, 235, 0.15); color: #60a5fa; }
.is-dark .btn-secondary:active { background: rgba(37, 99, 235, 0.25); }
.is-dark .s-chevron { color: #64748b; }
.is-dark .select-box.has-value .s-text { color: #f8fafc; }
.is-dark .jd-input { color: #f8fafc; }
.is-dark .progress-bar-container { background-color: #334155; }
</style>
