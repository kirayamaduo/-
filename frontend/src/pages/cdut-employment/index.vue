<template>
  <SlPage class="cdut-page app-soft-bg" :custom-class="[themeClass, fontClass].join(' ')">
    <SlNavBar :title="t('cdut.pageTitle')" show-back @back="goBack" :safe-top="topSafeHeight" :right-avoid-width="rightAvoidWidth" />

    <view class="content">
      <view class="hero app-card-gradient">
        <text class="hero-kicker">CDUT</text>
        <text class="hero-title">{{ t('cdut.pageTitle') }}</text>
        <text class="hero-sub">{{ t('cdut.pageSubtitle') }}</text>
      </view>

      <view v-if="loading" class="skeleton-list">
        <view class="skel-card app-surface" v-for="i in 3" :key="i">
          <view class="skel-line skel-w70"></view>
          <view class="skel-line skel-w40"></view>
          <view class="skel-line skel-w90"></view>
        </view>
      </view>

      <view v-else-if="insight">
        <view class="summary-card app-card-soft app-surface">
          <view class="summary-head">
            <view>
              <text class="summary-label">{{ insight.matchLabel }}</text>
              <text class="summary-title">{{ insight.major }} · {{ insight.targetRole }}</text>
            </view>
            <view class="refresh-btn" @click="refresh">
              <text class="refresh-icon ri-refresh-line"></text>
            </view>
          </view>
          <text class="summary-text">{{ insight.summary }}</text>
          <view class="metric-row">
            <view class="metric" v-if="insight.latestEmploymentRate !== undefined && insight.latestEmploymentRate !== null">
              <text class="metric-value">{{ formatPercent(insight.latestEmploymentRate) }}</text>
              <text class="metric-label">{{ t('cdut.employmentRate') }}</text>
            </view>
            <view class="metric" v-if="insight.latestPostgraduateRate !== undefined && insight.latestPostgraduateRate !== null">
              <text class="metric-value">{{ formatPercent(insight.latestPostgraduateRate) }}</text>
              <text class="metric-label">{{ t('cdut.postgraduateRate') }}</text>
            </view>
            <view class="metric">
              <text class="metric-value">{{ insight.sourceCount || 0 }}</text>
              <text class="metric-label">{{ t('cdut.publicSources') }}</text>
            </view>
          </view>
          <text class="updated" v-if="insight.updatedAt">{{ t('cdut.updatedAt') }} {{ formatDate(insight.updatedAt) }}</text>
        </view>

        <view class="section" v-if="insight.destinationHighlights?.length">
          <text class="section-title">{{ t('cdut.destinationTitle') }}</text>
          <view class="highlight-list">
            <view class="highlight-item app-card-soft" v-for="(item, idx) in insight.destinationHighlights" :key="item">
              <text class="highlight-index">{{ idx + 1 }}</text>
              <text class="highlight-text">{{ item }}</text>
            </view>
          </view>
        </view>

        <view class="section" v-if="insight.trend?.length">
          <text class="section-title">{{ t('cdut.trendTitle') }}</text>
          <view class="trend-card app-card-soft app-surface">
            <view class="trend-row" v-for="p in insight.trend" :key="p.year">
              <text class="trend-year">{{ p.year }}</text>
              <view class="trend-main">
                <view class="trend-bar">
                  <view class="trend-fill" :style="{ width: percentWidth(p.employmentRate) }"></view>
                </view>
                <text class="trend-value">{{ formatPercent(p.employmentRate) }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="section">
          <text class="section-title">{{ t('cdut.sourcesTitle') }}</text>
          <view class="source-list">
            <view class="source-card app-card-soft app-surface" v-for="source in insight.sources" :key="source.url" @click="openSource(source.url, source.title)">
              <view class="source-head">
                <text class="source-title">{{ source.title }}</text>
                <text class="source-year" v-if="source.year">{{ source.year }}</text>
              </view>
              <view class="source-tags">
                <text class="source-tag" v-if="source.sourceType">{{ source.sourceType }}</text>
                <text class="source-tag" v-if="source.majorKeyword">{{ source.majorKeyword }}</text>
                <text class="source-tag" v-if="source.careerKeyword">{{ source.careerKeyword }}</text>
              </view>
              <text class="source-excerpt" v-if="source.excerpt">{{ source.excerpt }}</text>
              <text class="source-link">{{ t('cdut.openSource') }}</text>
            </view>
          </view>
        </view>

        <view class="note app-card-soft app-surface">
          <text class="note-title">{{ t('cdut.noteTitle') }}</text>
          <text class="note-text">{{ t('cdut.noteText') }}</text>
        </view>

        <view class="method-card app-card-soft app-surface">
          <text class="note-title">{{ t('cdut.methodTitle') }}</text>
          <view class="method-row">
            <text class="method-step">1</text>
            <text class="method-text">{{ t('cdut.methodStep1') }}</text>
          </view>
          <view class="method-row">
            <text class="method-step">2</text>
            <text class="method-text">{{ t('cdut.methodStep2') }}</text>
          </view>
          <view class="method-row">
            <text class="method-step">3</text>
            <text class="method-text">{{ t('cdut.methodStep3') }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state app-empty app-surface">
        <text class="empty-icon ri-school-line"></text>
        <text class="empty-text">{{ t('cdut.empty') }}</text>
        <button class="btn-retry" @click="load">{{ t('common.retry') }}</button>
      </view>

      <view class="bottom-safe"></view>
    </view>
  </SlPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { useI18n } from '@/locales';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';
import { openLink } from '@/utils/openLink';
import SlPage from '@/style-library/components/SlPage.vue';
import SlNavBar from '@/style-library/components/SlNavBar.vue';
import {
  getCdutEmploymentInsightApi,
  refreshCdutEmploymentInsightApi,
  type CdutEmploymentInsight,
} from '@/api/cdutEmployment';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafeHeight = ref(52);
const rightAvoidWidth = ref(20);
const loading = ref(true);
const insight = ref<CdutEmploymentInsight | null>(null);

const load = async () => {
  loading.value = true;
  try {
    insight.value = await getCdutEmploymentInsightApi();
  } catch {
    insight.value = null;
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  loading.value = true;
  try {
    insight.value = await refreshCdutEmploymentInsightApi();
    uni.showToast({ title: t('common.refreshed'), icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('common.refreshFailed'), icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const formatPercent = (n?: number) => {
  if (n === undefined || n === null || isNaN(Number(n))) return '-';
  const value = Number(n);
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
};

const percentWidth = (n?: number) => `${Math.max(0, Math.min(100, Number(n || 0)))}%`;

const formatDate = (raw: string) => {
  const d = new Date(raw.replace(' ', 'T'));
  if (isNaN(d.getTime())) return raw;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const openSource = (url: string, title?: string) => {
  if (url) openLink(url, title);
};

const goBack = () => {
  uni.navigateBack({ delta: 1 });
};

onMounted(() => {
  refreshTheme();
  const safeMetrics = getMpSafeAreaMetrics();
  topSafeHeight.value = safeMetrics.topSafeHeight;
  rightAvoidWidth.value = safeMetrics.rightAvoidWidth;
  load();
});

onShow(() => {
  refreshTheme();
});

onPullDownRefresh(async () => {
  try {
    await refresh();
  } finally {
    uni.stopPullDownRefresh();
  }
});
</script>

<style scoped>
.cdut-page { min-height: 100vh; }
.content { padding: 16px var(--page-gutter, 20px) 0; box-sizing: border-box; }
.hero {
  border-radius: var(--radius-lg, 20px);
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hero-kicker { font-size: 11px; font-weight: 900; letter-spacing: 0.12em; color: rgba(255,255,255,0.78); }
.hero-title { font-size: 24px; line-height: 1.16; font-weight: 900; color: #ffffff; }
.hero-sub { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.86); }
.skeleton-list { display: flex; flex-direction: column; gap: 12px; margin-top: 18px; }
.skel-card { border-radius: var(--radius-md, 16px); padding: 18px; }
.skel-line { height: 12px; border-radius: 999px; background: var(--surface-3, #f1f5f9); margin-bottom: 10px; }
.skel-w70 { width: 70%; }
.skel-w40 { width: 40%; }
.skel-w90 { width: 90%; }
.summary-card { margin-top: 16px; padding: 16px; }
.summary-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.summary-label {
  display: inline-flex; padding: 4px 8px; border-radius: 999px;
  background: var(--primary-soft, #eff6ff); color: var(--primary-color, #2563eb);
  font-size: 11px; font-weight: 900;
}
.summary-title { display: block; margin-top: 8px; font-size: 18px; line-height: 1.32; font-weight: 900; color: var(--text-primary, #0f172a); }
.refresh-btn {
  width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  background: var(--surface-2, #f8fafc); border: 1px solid var(--border-color, #e2e8f0);
}
.refresh-icon { color: var(--primary-color, #2563eb); font-size: 17px; }
.summary-text { display: block; margin-top: 12px; font-size: 13px; line-height: 1.55; color: var(--text-secondary, #64748b); }
.metric-row { display: flex; gap: 8px; margin-top: 14px; }
.metric {
  flex: 1; min-width: 0; padding: 12px 8px; border-radius: 14px;
  background: var(--surface-2, #f8fafc); border: 1px solid var(--border-color, #e2e8f0);
}
.metric-value { display: block; font-size: 18px; line-height: 1.1; font-weight: 900; color: var(--text-primary, #0f172a); }
.metric-label { display: block; margin-top: 5px; font-size: 10.5px; color: var(--text-tertiary, #8e8e93); }
.updated { display: block; margin-top: 12px; font-size: 11px; color: var(--text-tertiary, #8e8e93); }
.section { margin-top: 22px; }
.section-title { display: block; font-size: 17px; font-weight: 900; color: var(--text-primary, #0f172a); margin-bottom: 12px; }
.highlight-list, .source-list { display: flex; flex-direction: column; gap: 10px; }
.highlight-item { display: flex; gap: 10px; padding: 13px; align-items: flex-start; }
.highlight-index {
  width: 24px; height: 24px; border-radius: 12px; background: var(--primary-soft, #eff6ff);
  color: var(--primary-color, #2563eb); font-size: 12px; font-weight: 900; text-align: center; line-height: 24px;
  flex-shrink: 0;
}
.highlight-text { flex: 1; font-size: 13px; line-height: 1.5; color: var(--text-secondary, #64748b); }
.trend-card { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.trend-row { display: flex; align-items: center; gap: 10px; }
.trend-year { width: 44px; font-size: 12px; font-weight: 900; color: var(--text-primary, #0f172a); }
.trend-main { flex: 1; display: flex; align-items: center; gap: 8px; }
.trend-bar { flex: 1; height: 8px; background: var(--surface-3, #f1f5f9); border-radius: 999px; overflow: hidden; }
.trend-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #38bdf8); border-radius: 999px; }
.trend-value { width: 48px; text-align: right; font-size: 12px; font-weight: 800; color: var(--text-secondary, #64748b); }
.source-card { padding: 14px; }
.source-head { display: flex; justify-content: space-between; gap: 10px; }
.source-title { flex: 1; font-size: 14px; line-height: 1.4; font-weight: 900; color: var(--text-primary, #0f172a); }
.source-year { font-size: 11px; color: var(--text-tertiary, #8e8e93); }
.source-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.source-tag { border-radius: 999px; padding: 3px 8px; background: var(--surface-2, #f8fafc); color: var(--text-secondary, #64748b); font-size: 10px; font-weight: 800; }
.source-excerpt { display: block; margin-top: 9px; font-size: 12px; line-height: 1.5; color: var(--text-secondary, #64748b); }
.source-link { display: block; margin-top: 10px; font-size: 12px; font-weight: 900; color: var(--primary-color, #2563eb); }
.note { margin-top: 20px; padding: 14px; }
.note-title { display: block; font-size: 13px; font-weight: 900; color: var(--text-primary, #0f172a); }
.note-text { display: block; margin-top: 6px; font-size: 12px; line-height: 1.5; color: var(--text-secondary, #64748b); }
.method-card { margin-top: 12px; padding: 14px; }
.method-row { display: flex; align-items: flex-start; gap: 10px; margin-top: 10px; }
.method-step {
  width: 22px; height: 22px; border-radius: 11px; line-height: 22px; text-align: center;
  background: var(--primary-soft, #eff6ff); color: var(--primary-color, #2563eb);
  font-size: 11px; font-weight: 900; flex-shrink: 0;
}
.method-text { flex: 1; font-size: 12px; line-height: 1.5; color: var(--text-secondary, #64748b); }
.empty-state { margin-top: 18px; padding: 44px 20px; text-align: center; }
.empty-icon { font-size: 42px; display: block; margin-bottom: 12px; }
.empty-text { display: block; font-size: 14px; color: var(--text-secondary, #64748b); margin-bottom: 16px; }
.btn-retry { width: 136px; height: 40px; line-height: 40px; border-radius: 12px; background: var(--primary-color, #2563eb); color: #fff; font-size: 14px; }
.bottom-safe { height: calc(env(safe-area-inset-bottom, 0px) + 28px); }

.is-dark .summary-card,
.is-dark .trend-card,
.is-dark .source-card,
.is-dark .note,
.is-dark .method-card,
.is-dark .metric,
.is-dark .refresh-btn,
.is-dark .source-tag {
  background: #1e293b;
  border-color: #334155;
  box-shadow: none;
}
.is-dark .summary-title,
.is-dark .metric-value,
.is-dark .section-title,
.is-dark .trend-year,
.is-dark .source-title,
.is-dark .note-title { color: #f8fafc; }
.is-dark .summary-text,
.is-dark .highlight-text,
.is-dark .trend-value,
.is-dark .source-excerpt,
.is-dark .note-text { color: #94a3b8; }
.is-dark .summary-label,
.is-dark .highlight-index,
.is-dark .method-step { background: rgba(37, 99, 235, 0.2); }
.is-dark .method-text { color: #94a3b8; }
</style>
