<template>
  <SlPage class="app-soft-bg" :custom-class="[themeClass, fontClass].join(' ')">
    <SlNavBar :title="t('checkin.navTitle')" show-back @back="goBack" :safe-top="topSafeHeight" />

    <view class="checkin-content">
      <view class="hero-card">
        <view class="hero-row">
          <view class="hero-streak">
            <text class="streak-num">{{ status?.streakDays || 0 }}</text>
            <text class="streak-label">{{ t('checkin.dayStreakLabel') }}</text>
          </view>
          <view class="hero-progress">
            <text class="hero-progress-text">{{ status?.todayCompleted || 0 }}/{{ status?.todayTotal || 3 }}</text>
            <text class="hero-progress-label">{{ t('checkin.tasksDoneToday') }}</text>
          </view>
        </view>
        <view class="hero-bar">
          <view class="hero-bar-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="hero-tip">{{ heroTip }}</text>
      </view>

      <view class="actions-card app-card-soft app-surface">
        <text class="actions-title">{{ t('checkin.todayTasksTitle') }}</text>
        <view class="action-list">
          <view
            v-for="a in actionItems"
            :key="a.code"
            :class="['action-row', 'ui-list-item', a.done ? 'action-done' : '']"
            @click="navTo(a.target)"
          >
            <text class="action-icon" :class="[a.tone, a.icon]"></text>
            <view class="action-body">
              <text class="action-name">{{ a.label }}</text>
              <text class="action-desc">{{ a.done ? t('checkin.completedToday') : a.cta }}</text>
            </view>
            <text class="action-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="week-card app-card-soft app-surface">
        <text class="week-title">{{ t('checkin.last7Title') }}</text>
        <view class="week-grid">
          <view
            v-for="(d, idx) in last7Days"
            :key="idx"
            :class="['week-cell', d.active ? 'week-cell-active' : '', d.isToday ? 'week-cell-today' : '']"
          >
            <text class="week-cell-dow">{{ d.dow }}</text>
            <text class="week-cell-day">{{ d.dayLabel }}</text>
            <text class="week-cell-icon ri-check-line" v-if="d.active"></text>
          </view>
        </view>
        <text class="week-meta">{{ t('checkin.weekMeta', { n: status?.weeklyDays || 0 }) }}</text>
        <view class="badge-row" v-if="status?.badgeEarnedThisWeek">
          <text class="badge-icon ri-trophy-line"></text>
          <text class="badge-text">{{ t('checkin.weeklyBadge') }}</text>
        </view>
      </view>

      <view class="bottom-safe"></view>
    </view>
  </SlPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { getCheckInStatusApi, getCheckInCalendarApi, type CheckInStatus, type CheckInDay } from '@/api/checkin';
import { useTheme } from '@/utils/theme';
import SlPage from '@/style-library/components/SlPage.vue';
import SlNavBar from '@/style-library/components/SlNavBar.vue';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafeHeight = ref(52);

const status = ref<CheckInStatus | null>(null);
const calendar = ref<CheckInDay[]>([]);

const goBack = () => uni.navigateBack({ delta: 1 });

const heroTip = computed(() => {
  if (!status.value) return t('checkin.heroLoading');
  if (status.value.todayCompleted >= status.value.todayTotal) return t('checkin.heroAllDone');
  if (status.value.todayCompleted > 0) return t('checkin.heroAlmostDone');
  return t('checkin.heroStartStreak');
});

const progressPercent = computed(() => {
  if (!status.value || status.value.todayTotal === 0) return 0;
  return Math.round((status.value.todayCompleted / status.value.todayTotal) * 100);
});

interface ActionItem {
  code: string;
  label: string;
  cta: string;
  icon: string;
  tone: string;
  target: string;
  done: boolean;
}

const actionItems = computed<ActionItem[]>(() => {
  const done = new Set(status.value?.completedActionsToday || []);
  return [
    {
      code: 'ASSESSMENT',
      label: t('checkin.actionAssessmentLabel'),
      cta: t('checkin.actionAssessmentCta'),
      icon: 'ri-brain-line',
      tone: 'tone-blue',
      target: '/pages/assessment/index',
      done: done.has('ASSESSMENT'),
    },
    {
      code: 'INTERVIEW',
      label: t('checkin.actionInterviewLabel'),
      cta: t('checkin.actionInterviewCta'),
      icon: 'ri-mic-2-line',
      tone: 'tone-orange',
      target: '/pages/interview/start',
      done: done.has('INTERVIEW'),
    },
    {
      code: 'SKILL_NODE',
      label: t('checkin.actionSkillLabel'),
      cta: t('checkin.actionSkillCta'),
      icon: 'ri-map-2-line',
      tone: 'tone-violet',
      target: '/pages/map/index',
      done: done.has('SKILL_NODE'),
    },
  ];
});

interface DayCell {
  date: string;
  dow: string;
  dayLabel: string;
  active: boolean;
  isToday: boolean;
}

const last7Days = computed<DayCell[]>(() => {
  const days: DayCell[] = [];
  const dowNames = [t('checkin.dow.sun'), t('checkin.dow.mon'), t('checkin.dow.tue'), t('checkin.dow.wed'), t('checkin.dow.thu'), t('checkin.dow.fri'), t('checkin.dow.sat')];
  const today = new Date();
  const activeSet = new Set(calendar.value.map((c) => c.day));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: iso,
      dow: dowNames[d.getDay()],
      dayLabel: String(d.getDate()),
      active: activeSet.has(iso),
      isToday: i === 0,
    });
  }
  return days;
});

const navTo = (url: string) => {
  uni.navigateTo({ url });
};

const load = async () => {
  try {
    const [s, c] = await Promise.all([getCheckInStatusApi(), getCheckInCalendarApi()]);
    status.value = s;
    calendar.value = c || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('checkin.loadFailed'), icon: 'none' });
  }
};

onMounted(() => {
  refreshTheme();
  topSafeHeight.value = getMpSafeAreaMetrics().topSafeHeight;
});

onShow(() => {
  refreshTheme();
  load();
});
</script>

<style scoped>
.checkin-content {
  padding: 8px var(--page-gutter, 20px) 24px;
  box-sizing: border-box;
}

.hero-card {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: var(--radius-lg, 20px);
  padding: 22px var(--space-xl, 20px);
  color: #fff;
  margin-top: var(--space-sm, 8px);
  box-shadow: var(--shadow-card);
}
.hero-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14px; }
.hero-streak { display: flex; align-items: baseline; gap: 6px; }
.streak-num { font-size: 44px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
.streak-label { font-size: var(--font-caption, 13px); opacity: 0.85; }
.hero-progress { text-align: right; display: flex; flex-direction: column; gap: 2px; }
.hero-progress-text { font-size: var(--font-title, 18px); font-weight: 700; }
.hero-progress-label { font-size: 11px; opacity: 0.85; }
.hero-bar { width: 100%; height: 8px; background: rgba(255, 255, 255, 0.25); border-radius: 999px; overflow: hidden; }
.hero-bar-fill { height: 100%; background: var(--surface-2, #f8fafc); border-radius: 999px; transition: width 0.3s; }
.hero-tip { display: block; margin-top: 14px; font-size: var(--font-caption, 13px); opacity: 0.92; line-height: var(--line-height-body, 1.5); }

.actions-card { margin-top: var(--space-xl, 20px); border-radius: var(--radius-lg, 20px); padding: 18px; }
.actions-title { font-size: var(--font-caption, 13px); font-weight: 700; color: var(--text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 14px; }
.action-list { display: flex; flex-direction: column; gap: 10px; }
.action-row {
  display: flex; align-items: center; gap: 14px;
  background: var(--surface-2, #f8fafc); border-color: var(--border-color, #b8c8d8);
  border-radius: var(--btn-radius, 14px); padding: 12px 14px;
  transition: transform 0.15s;
}
.action-row:active { transform: scale(0.99); }
.action-done { background: var(--success-soft, #dcfce7); border-color: #86efac; }
.action-icon {
  width: 40px; height: 40px; border-radius: var(--radius-sm, 12px);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.tone-blue { background: linear-gradient(135deg, var(--primary-soft, #eff6ff), #bfdbfe); }
.tone-orange { background: linear-gradient(135deg, var(--accent-soft, #fff7ed), #fed7aa); }
.tone-violet { background: linear-gradient(135deg, #ede9fe, #c4b5fd); }
.action-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.action-name { font-size: 14px; font-weight: 700; color: var(--text-primary, #0f172a); }
.action-desc { font-size: 12px; color: var(--text-secondary, #64748b); }
.action-done .action-desc { color: var(--success-color, #059669); font-weight: 600; }
.action-arrow { font-size: 18px; color: var(--text-tertiary, #8e8e93); line-height: 1; }

.week-card { margin-top: var(--space-xl, 20px); border-radius: var(--radius-lg, 20px); padding: 18px; }
.week-title { font-size: var(--font-caption, 13px); font-weight: 700; color: var(--text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 14px; }
.week-grid { display: flex; gap: var(--space-sm, 8px); }
.week-cell {
  flex: 1; aspect-ratio: 1 / 1.1;
  background: var(--surface-3, #f1f5f9); border-radius: var(--radius-sm, 12px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; position: relative;
}
.week-cell-active { background: var(--primary-color, #2563eb); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }
.week-cell-today { border: 2px solid var(--primary-color, #2563eb); }
.week-cell-active.week-cell-today { border-color: rgba(255, 255, 255, 0.3); }

.week-cell-dow { font-size: 11px; color: var(--text-tertiary, #8e8e93); font-weight: 600; }
.week-cell-day { font-size: 14px; color: var(--text-secondary, #64748b); font-weight: 700; }
.week-cell-today:not(.week-cell-active) .week-cell-day { color: var(--text-primary, #0f172a); }

.week-cell-active .week-cell-dow { color: rgba(255, 255, 255, 0.85); }
.week-cell-active .week-cell-day { color: #ffffff; }
.week-cell-icon { font-size: 14px; color: #ffffff; position: absolute; bottom: 3px; font-weight: 800; }
.week-meta { display: block; margin-top: var(--space-md, 12px); font-size: 12px; color: var(--text-secondary, #64748b); }
.badge-row { display: flex; align-items: center; gap: var(--space-sm, 8px); margin-top: var(--space-md, 12px); padding: 10px 12px; background: #fef3c7; border-radius: 10px; }
.badge-icon { font-size: 18px; }
.badge-text { font-size: 12.5px; color: #92400e; font-weight: 600; line-height: 1.4; }

.bottom-safe { height: calc(env(safe-area-inset-bottom, 0px) + 24px); }

/* Dark mode */
.is-dark .actions-card,
.is-dark .week-card { background: #1e293b; box-shadow: none; border-color: #334155; }
.is-dark .actions-title,
.is-dark .week-title,
.is-dark .week-meta { color: #94a3b8; }
.is-dark .action-row { background: #0f172a; border-color: #334155; }
.is-dark .action-name { color: #f8fafc; }
.is-dark .action-desc { color: #94a3b8; }
.is-dark .action-done { background: rgba(16, 185, 129, 0.16); border-color: #34d399; }
.is-dark .action-done .action-desc { color: #6ee7b7; }
.is-dark .hero-bar { background: rgba(255, 255, 255, 0.22); }
.is-dark .hero-bar-fill { background: linear-gradient(90deg, #67e8f9, #a7f3d0); }
.is-dark .tone-blue {
  background: rgba(37, 99, 235, 0.22);
  color: #93c5fd;
  border: 1px solid rgba(147, 197, 253, 0.32);
}
.is-dark .tone-orange {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.32);
}
.is-dark .tone-violet {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
  border: 1px solid rgba(196, 181, 253, 0.32);
}
.is-dark .week-cell { background: #0f172a; }
.is-dark .week-cell-day { color: #64748b; }
.is-dark .week-cell-today:not(.week-cell-active) .week-cell-day { color: #f8fafc; }
.is-dark .week-cell-dow { color: #475569; }
.is-dark .week-cell-active { background: var(--primary-color, #2563eb); box-shadow: none; }
.is-dark .week-cell-active .week-cell-day,
.is-dark .week-cell-active .week-cell-dow { color: #ffffff; }
</style>
