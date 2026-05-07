<template>
  <view class="home-page" :class="[themeClass, fontClass]">
    <view class="status-spacer" :style="{ height: topSafeHeight + 'px' }"></view>

    <view class="top-bar">
      <view class="search-bar">
        <view class="search-icon-wrap" @click="onSearch">
          <text class="search-icon-svg">🔍</text>
        </view>
        <input
          class="search-input"
          v-model="searchQuery"
          :placeholder="t('home.searchPlaceholder')"
          placeholder-class="search-ph"
          @confirm="onSearch"
        />
        <view class="search-clear" v-if="searchQuery" @click="clearSearch">
          <text class="clear-icon">×</text>
        </view>
      </view>
      <image
        class="user-avatar"
        :src="avatarSrc"
        mode="aspectFill"
        @click="handleAvatarClick"
      />
    </view>

    <view class="greeting-row">
      <text class="greeting-kicker">Career Loop</text>
      <text class="greeting-title">Hello, {{ userInfo.nickname || 'Guest' }}</text>
      <text class="greeting-text">{{ t('home.pullToRefresh') }}</text>
    </view>

    <view class="feature-grid">
      <view class="feature-item" @click="navTo('/pages/assessment/index')">
        <view class="feature-icon icon-assess">
          <text class="fi-char">&#x1F9ED;</text>
        </view>
        <text class="feature-label">{{ t('home.featureAssessment') }}</text>
      </view>
      <view class="feature-item" @click="navTo('/pages/map/index')">
        <view class="feature-icon icon-map">
          <text class="fi-char">&#x1F5FA;</text>
        </view>
        <text class="feature-label">{{ t('home.featureSkillMap') }}</text>
      </view>
      <view class="feature-item" @click="navTo('/pages/resume-ai/index')">
        <view class="feature-icon icon-ai">
          <text class="fi-char">&#x2728;</text>
        </view>
        <text class="feature-label">{{ t('home.featureAiResume') }}</text>
      </view>
      <view class="feature-item" @click="navTo('/pages/interview/start')">
        <view class="feature-icon icon-interview">
          <text class="fi-char">&#x1F3A4;</text>
        </view>
        <text class="feature-label">{{ t('home.featureMockInterview') }}</text>
      </view>
    </view>

    <!-- 7-day check-in chip — short, glanceable, taps through to the calendar -->
    <view v-if="checkin" class="checkin-card" @click="navTo('/pages/checkin/index')">
      <view class="checkin-left">
        <text class="checkin-kicker">{{ t('checkin.title') }}</text>
        <text class="checkin-title">{{ t('checkin.streak', { n: checkin.streakDays || 0 }) }}</text>
        <text class="checkin-sub">{{ checkin.todayCompleted }}/{{ checkin.todayTotal }} {{ t('checkin.todayDone') }} · {{ checkin.weeklyDays }}/7 {{ t('checkin.weeklyDays') }}</text>
      </view>
      <view class="checkin-right">
        <view class="checkin-bar">
          <view class="checkin-bar-fill" :style="{ width: checkinPercent + '%' }"></view>
        </view>
        <text class="checkin-cta">{{ t('checkin.viewCalendar') }}</text>
      </view>
    </view>
    <view v-if="checkin && (!checkin.streakDays || !checkin.todayCompleted)" class="checkin-tip">
      <text class="checkin-tip-text">{{ t('checkin.keepStreak') }}</text>
    </view>

    <view v-if="agentToday" class="agent-card">
      <view class="agent-card-head">
        <view class="agent-icon-wrap">
          <text class="agent-icon">🤖</text>
        </view>
        <view class="agent-head-copy">
          <text class="agent-kicker">{{ t('home.agentKicker') }}</text>
          <text class="agent-title">{{ agentHeadline }}</text>
        </view>
        <view class="risk-pill" :class="'risk-' + agentToday.riskLevel.toLowerCase()">
          <text class="risk-text">{{ agentToday.riskLevel === 'HIGH' ? t('home.riskLevelHigh') : agentToday.riskLevel === 'LOW' ? t('home.riskLevelLow') : t('home.riskLevelMedium') }}</text>
        </view>
      </view>
      <view v-if="agentProfile" class="agent-pct-row" @click="navTo('/pages/agent/profile')">
        <view class="agent-pct-bar-wrap">
          <view class="agent-pct-bar-fill" :style="{ width: agentProfile.completenessScore + '%' }" :class="'agent-pct-' + agentProfile.personalizationLevel.toLowerCase()"></view>
        </view>
        <text class="agent-pct-label">{{ agentProfile.personalizationLevel === 'HIGH' ? t('agent.hub.profileLevelHigh') : agentProfile.personalizationLevel === 'MEDIUM' ? t('agent.hub.profileLevelMedium') : t('agent.hub.profileLevelLow') }} · {{ agentProfile.completenessScore }}%</text>
        <text class="agent-pct-arrow">›</text>
      </view>
      <view v-if="agentProfile && agentProfile.missingSignals?.length" class="agent-missing-row">
        <text class="agent-missing-label">{{ t('home.agentHelpLabel') }}</text>
        <view class="agent-missing-chips">
          <view v-for="sig in agentProfile.missingSignals.slice(0, 2)" :key="sig.key" class="agent-missing-chip" @click="navTo('/pages/agent/profile')">
            <text class="agent-missing-chip-text">+ {{ sig.label }}</text>
          </view>
        </view>
      </view>
      <view class="agent-progress">
        <view class="agent-progress-bar">
          <view class="agent-progress-fill" :style="{ width: agentToday.progressPercent + '%' }"></view>
        </view>
        <text class="agent-progress-text">{{ t('agent.hub.readiness', { n: agentToday.progressPercent }) }}</text>
      </view>
      <text class="agent-focus">{{ t('home.todayFocusPrefix') }}{{ agentFocus }}</text>
      <text class="agent-reason">{{ agentReason }}</text>
      <view v-if="agentRiskReasons.length" class="agent-risks">
        <text v-for="reason in agentRiskReasons.slice(0, 2)" :key="reason" class="agent-risk-item">• {{ reason }}</text>
      </view>
      <view v-if="agentToday.actions?.length" class="agent-actions">
        <view
          v-for="action in agentToday.actions.slice(0, 2)"
          :key="action.label"
          class="agent-action"
          :class="{ 'agent-action-primary': action.priority === 'HIGH' }"
          @click="navTo(action.target)"
        >
          <text class="agent-action-text">{{ action.labelKey ? t(action.labelKey) : action.label }}</text>
        </view>
      </view>
      <view v-if="agentTasks.length" class="agent-task-list">
        <view v-for="task in agentTasks" :key="task.taskId" class="agent-task-row" :class="{ 'agent-task-done': task.status === 'DONE' }">
          <view class="agent-task-main" @click="task.target ? navTo(task.target) : undefined">
            <view class="agent-task-title-row">
              <text class="agent-task-title">{{ task.title }}</text>
              <text v-if="task.source === 'PLAN_WEEKLY'" class="agent-task-source">{{ t('home.taskSourcePlan') }}</text>
            </view>
            <text class="agent-task-desc">{{ task.description || t('home.agentTaskDefaultDesc') }}</text>
          </view>
          <view class="agent-task-actions">
            <view v-if="task.status !== 'DONE'" class="agent-task-btn agent-task-complete" @click.stop="completeAgentTask(task.taskId)">
              <text class="agent-task-btn-text">{{ t('agent.hub.taskDone') }}</text>
            </view>
            <view v-if="task.status === 'TODO'" class="agent-task-btn" @click.stop="dismissAgentTask(task.taskId)">
              <text class="agent-task-btn-text">{{ t('agent.hub.taskSkip') }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="agent-hub-entry" @click="navTo('/pages/agent/index')">
        <text class="agent-hub-entry-text">{{ t('home.agentHubEntry') }}</text>
      </view>
    </view>

    <!-- Section 1 — Career Videos (Bilibili) -->
    <view class="section" v-if="filteredVideos.length > 0">
      <view class="section-header">
        <view class="section-titles">
          <text class="section-title">{{ t('home.videos') }}</text>
          <text class="section-meta">{{ t('home.videosSubtitle') }}</text>
        </view>
      </view>

      <scroll-view class="hscroll" scroll-x :show-scrollbar="false">
        <view class="hscroll-track">
          <view
            class="video-card"
            v-for="(v, idx) in filteredVideos"
            :key="v.id"
            @click="openLink(v.url, v.title)"
          >
            <view class="video-cover" :class="'cover-tone-' + (idx % 4)">
              <image v-if="v.coverUrl" class="video-cover-img" :src="v.coverUrl" mode="aspectFill" />
              <view class="play-icon-wrap">
                <text class="play-icon">▶</text>
              </view>
              <view class="duration-badge" v-if="v.durationSec">
                <text class="duration-text">{{ formatDuration(v.durationSec) }}</text>
              </view>
            </view>
            <view class="video-body">
              <text class="video-title">{{ v.title }}</text>
              <view class="video-meta-row">
                <text class="video-up">{{ v.upName || 'UP' }}</text>
                <text class="video-views" v-if="v.viewCount">· {{ formatViews(v.viewCount) }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Section 2 — Career Insights (articles) -->
    <view class="section" v-if="filteredArticles.length > 0">
      <view class="section-header">
        <view class="section-titles">
          <text class="section-title">{{ t('home.articles') }}</text>
          <text class="section-meta">{{ t('home.articlesSubtitle') }}</text>
        </view>
      </view>

      <view class="article-list">
        <view
          class="article-card"
          v-for="(a, idx) in filteredArticles"
          :key="a.id"
          @click="openArticle(a)"
        >
          <view class="article-cover" :class="'cover-tone-' + (idx % 4)">
            <image
              class="article-cover-img"
              :src="articleImageSrc(a, idx)"
              mode="aspectFill"
              @error="onArticleImageError(a.id)"
            />
          </view>
          <view class="article-body">
            <text class="article-title">{{ a.title }}</text>
            <text v-if="a.summary" class="article-summary">{{ a.summary }}</text>
            <view class="article-tag" v-if="a.category">
              <text class="article-tag-text">{{ a.category }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Section 3 — Career Consultations -->
    <view class="section" v-if="filteredConsultations.length > 0">
      <view class="section-header">
        <view class="section-titles">
          <text class="section-title">{{ t('home.consultations') }}</text>
          <text class="section-meta">{{ t('home.consultationsSubtitle') }}</text>
        </view>
      </view>

      <view class="consult-list">
        <view
          class="consult-card"
          v-for="c in filteredConsultations"
          :key="c.id"
          @click="c.sourceUrl ? openConsultation(c.sourceUrl, c.title) : undefined"
          :style="c.sourceUrl ? 'cursor:pointer' : ''"
        >
          <view class="consult-head">
            <text class="consult-title">{{ c.title }}</text>
            <text v-if="c.author" class="consult-author">{{ c.author }}</text>
          </view>
          <text v-if="c.body" class="consult-body">{{ c.body }}</text>
          <text v-if="c.sourceUrl" class="consult-link-hint">{{ consultLinkHint(c.sourceUrl) }}</text>
        </view>
      </view>
    </view>

    <!-- Section 4 — Career path spotlights -->
    <view class="section" v-if="filteredCareerCards.length > 0">
      <view class="section-header">
        <view class="section-titles">
          <text class="section-title">{{ t('home.careerPaths') }}</text>
          <text class="section-meta">{{ t('home.careerPathsSubtitle') }}</text>
        </view>
        <view class="section-more" @click="navTo('/pages/map/index')">
          <text class="section-more-text">{{ t('home.careerPathsOpen') }}</text>
          <text class="section-more-arrow">›</text>
        </view>
      </view>

      <view class="path-grid">
        <view
          class="path-card"
          v-for="(p, idx) in filteredCareerCards"
          :key="p.pathId"
          :class="'cover-tone-' + (idx % 4)"
          @click="navTo('/pages/map/index?pathId=' + p.pathId)"
        >
          <text class="path-name">{{ p.name }}</text>
          <text class="path-desc">{{ p.description }}</text>
        </view>
      </view>
    </view>

    <view class="empty-state"
          v-if="searchQuery && filteredVideos.length === 0 && filteredArticles.length === 0 && filteredConsultations.length === 0 && filteredCareerCards.length === 0">
      <text class="empty-icon">🔍</text>
      <text class="empty-text">{{ t('home.searchEmpty', { q: searchQuery }) }}</text>
      <button class="btn-clear" @click="clearSearch">{{ t('home.searchClear') }}</button>
    </view>

    <view class="empty-state"
          v-if="!searchQuery && homeError">
      <text class="empty-icon">⚠️</text>
      <text class="empty-text">{{ homeError }}</text>
      <button class="btn-clear" @click="loadHomeContent">{{ t('common.retry') }}</button>
    </view>

    <view class="bottom-safe"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from '@/locales';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { openLink } from '@/utils/openLink';
import { refreshHomeContentApi } from '@/api/home';
import { getTopSafeHeight } from '@/utils/safeArea';
import {
  getHomeContentApi,
  type BiliVideoCard,
  type HomeArticle,
  type HomeConsultation,
  type CareerCard,
} from '@/api/home';
import { getCheckInStatusApi, type CheckInStatus } from '@/api/checkin';
import {
  completeAgentTaskApi,
  dismissAgentTaskApi,
  getAgentBundleApi,
  type AgentTask,
  type AgentUserProfile,
  type CareerAgentToday,
} from '@/api/agent';
import { clearAuthState, LOGIN_PAGE } from '@/utils/auth';
import { useTheme } from '@/utils/theme';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = /api\.careerloop\.top/i.test(RAW_BASE_URL)
  ? 'http://129.28.97.93:8088'
  : RAW_BASE_URL;

const userInfo = ref<{
  nickname: string;
  avatarUrl: string;
  avatarViewUrl?: string;
}>({
  nickname: '',
  avatarUrl: '',
  avatarViewUrl: '',
});

const avatarSrc = computed(() => {
  if (userInfo.value.avatarViewUrl) return userInfo.value.avatarViewUrl;
  const raw = userInfo.value.avatarUrl;
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  return '/static/default-avatar.png';
});

const topSafeHeight = ref(88);
const searchQuery = ref('');

const videos = ref<BiliVideoCard[]>([]);
const articles = ref<HomeArticle[]>([]);
const consultations = ref<HomeConsultation[]>([]);
const careerCards = ref<CareerCard[]>([]);
const homeError = ref('');
const checkin = ref<CheckInStatus | null>(null);
const agentToday = ref<CareerAgentToday | null>(null);
const agentTasks = ref<AgentTask[]>([]);
const agentProfile = ref<AgentUserProfile | null>(null);
const checkinPercent = computed(() => {
  if (!checkin.value || !checkin.value.todayTotal) return 0;
  return Math.round((checkin.value.todayCompleted / checkin.value.todayTotal) * 100);
});
const tkKey = (key: string | undefined, fallback: string) => (key ? t(key) : fallback);
const agentHeadline = computed(() => tkKey(agentToday.value?.headlineKey, agentToday.value?.headline || ''));
const agentFocus = computed(() => tkKey(agentToday.value?.focusKey, agentToday.value?.todayFocus || ''));
const agentReason = computed(() => tkKey(agentToday.value?.reasonKey, agentToday.value?.reason || ''));
const agentRiskReasons = computed(() => {
  const today = agentToday.value;
  if (!today?.riskReasons?.length) return [];
  return today.riskReasons.map((raw, i) => {
    const key = today.riskReasonKeys?.[i];
    return key ? t(key) : raw;
  });
});

// Search filters every section so the home page works as a quick triage tool.
const matches = (haystack: string | undefined | null, q: string) =>
  !!haystack && haystack.toLowerCase().includes(q);

const filteredVideos = computed(() => {
  if (!searchQuery.value) return videos.value;
  const q = searchQuery.value.toLowerCase();
  return videos.value.filter(v => matches(v.title, q) || matches(v.upName, q) || matches(v.keyword, q));
});

const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value;
  const q = searchQuery.value.toLowerCase();
  return articles.value.filter(a => matches(a.title, q) || matches(a.summary, q) || matches(a.category, q));
});

/**
 * Local fallback covers guarantee that article cards always have an image,
 * even when remote URLs expire (e.g. seeded 3rd-party links returning 404).
 */
const ARTICLE_FALLBACK_COVERS = [
  '/static/tabbar/home-active.png',
  '/static/tabbar/resume-active.png',
  '/static/tabbar/map-active.png',
  '/static/tabbar/assistant-active.png',
];
const articleBrokenMap = ref<Record<number, boolean>>({});

const fallbackByIndex = (idx: number) =>
  ARTICLE_FALLBACK_COVERS[Math.abs(idx) % ARTICLE_FALLBACK_COVERS.length];

const articleImageSrc = (a: HomeArticle, idx: number): string => {
  if (articleBrokenMap.value[a.id]) return fallbackByIndex(idx);
  // Route through backend proxy so WeChat can display third-party covers
  // (no business-domain whitelist pain on arbitrary article hosts).
  if (a.sourceUrl) return `${API_BASE_URL}/api/homepage/articles/${a.id}/cover`;
  return a.imageUrl || fallbackByIndex(idx);
};

const onArticleImageError = (id: number) => {
  articleBrokenMap.value[id] = true;
};

const filteredConsultations = computed(() => {
  if (!searchQuery.value) return consultations.value;
  const q = searchQuery.value.toLowerCase();
  return consultations.value.filter(c => matches(c.title, q) || matches(c.body, q) || matches(c.author, q));
});

const filteredCareerCards = computed(() => {
  if (!searchQuery.value) return careerCards.value;
  const q = searchQuery.value.toLowerCase();
  return careerCards.value.filter(p => matches(p.name, q) || matches(p.description, q));
});

const onSearch = () => {
  uni.hideKeyboard();
};

const clearSearch = () => {
  searchQuery.value = '';
};

const formatDuration = (sec: number): string => {
  if (!sec || sec < 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatViews = (n: number): string => {
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + '亿';
  if (n >= 10_000) return (n / 10_000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

const openArticle = (a: HomeArticle) => {
  if (!a.url) {
    uni.showToast({ title: 'No link attached', icon: 'none' });
    return;
  }
  // In-app routes go through navigateTo; external https URLs go through the
  // shared openLink util (which handles the WeChat MP web-view fallback).
  if (a.url.startsWith('/pages/')) {
    uni.navigateTo({ url: a.url });
  } else {
    openLink(a.url, a.title);
  }
};

const loadHomeContent = async () => {
  homeError.value = '';
  try {
    const userId = uni.getStorageSync('userId');
    const numericUserId = Number(userId);
    const data = await getHomeContentApi(
      userId && !isNaN(numericUserId) && numericUserId > 0 ? numericUserId : undefined
    );

    videos.value = data?.videos || [];
    articles.value = data?.articles || [];
    consultations.value = data?.consultations || [];
    careerCards.value = data?.careerCards || [];
  } catch (e: any) {
    videos.value = [];
    articles.value = [];
    consultations.value = [];
    careerCards.value = [];
    homeError.value = e?.message || '首页内容加载失败，请检查网络或后端服务';
  }
};

// Best-effort: failing to load streak should never break the home feed.
const loadCheckin = async () => {
  const uid = Number(uni.getStorageSync('userId'));
  if (!uid || uid <= 0) {
    checkin.value = null;
    return;
  }
  try {
    checkin.value = await getCheckInStatusApi();
  } catch {
    checkin.value = null;
  }
};

const loadAgentToday = async () => {
  const uid = Number(uni.getStorageSync('userId'));
  if (!uid || uid <= 0) {
    agentToday.value = null;
    agentTasks.value = [];
    agentProfile.value = null;
    return;
  }
  try {
    const bundle = await getAgentBundleApi();
    agentToday.value = bundle.today;
    agentTasks.value = bundle.tasks || [];
    agentProfile.value = bundle.profile;
  } catch {
    agentToday.value = null;
    agentTasks.value = [];
    agentProfile.value = null;
  }
};

const completeAgentTask = async (taskId: number) => {
  try {
    const updated = await completeAgentTaskApi(taskId);
    agentTasks.value = agentTasks.value.map((task) => task.taskId === taskId ? updated : task);
    uni.showToast({ title: 'Task completed', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || 'Failed', icon: 'none' });
  }
};

const dismissAgentTask = async (taskId: number) => {
  try {
    await dismissAgentTaskApi(taskId);
    agentTasks.value = agentTasks.value.filter((task) => task.taskId !== taskId);
    uni.showToast({ title: 'Skipped', icon: 'none' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || 'Failed', icon: 'none' });
  }
};

const syncUserFromStorage = () => {
  const info = uni.getStorageSync('userInfo');
  userInfo.value = info
    ? { avatarUrl: '', avatarViewUrl: '', nickname: '', ...info }
    : { nickname: '', avatarUrl: '', avatarViewUrl: '' };
};

onMounted(() => {
  syncUserFromStorage();
  refreshTheme();
  topSafeHeight.value = getTopSafeHeight();
  loadHomeContent();
  loadCheckin();
  loadAgentToday();
});

onShow(() => {
  syncUserFromStorage();
  refreshTheme();
  // Refresh streak on tab return so finishing an interview/assessment
  // immediately bumps the chip without requiring a pull-to-refresh.
  loadCheckin();
  loadAgentToday();
});

onPullDownRefresh(async () => {
  try {
    const userId = uni.getStorageSync('userId');
    const numericUserId = Number(userId);
    const uid = userId && !isNaN(numericUserId) && numericUserId > 0 ? numericUserId : undefined;
    // Fire-and-forget: trigger a fresh Bilibili pull in the background.
    // We deliberately do NOT await this — a 429 rate-limit or network
    // hiccup must never prevent the local content from reloading.
    refreshHomeContentApi(uid).catch(() => {/* rate-limited or offline, ignore */});
    await Promise.all([loadHomeContent(), loadCheckin(), loadAgentToday()]);
    uni.showToast({ title: '已刷新', icon: 'success' });
  } catch {
    uni.showToast({ title: '刷新失败', icon: 'none' });
  } finally {
    uni.stopPullDownRefresh();
  }
});

const navTo = (url: string) => {
  const base = url.split('?')[0];
  if (SWITCH_TAB_PATHS.has(base)) {
    uni.switchTab({ url: base });
    return;
  }
  uni.navigateTo({ url });
};

/** Tab roots from pages.json — use switchTab so MP doesn’t open a webview. */
const SWITCH_TAB_PATHS = new Set([
  '/pages/home/index',
  '/pages/messages/index',
  '/pages/assistant/index',
  '/pages/resume/index',
  '/pages/user/index',
]);

const consultLinkHint = (raw: string) => {
  const base = (raw || '').split('?')[0];
  const n = base.startsWith('/') ? base : `/${base}`;
  if (n.startsWith('/pages/')) return '去试试 ›';
  return '阅读全文 ›';
};

const openConsultation = (raw: string, title?: string) => {
  if (!raw) return;
  const base = raw.split('?')[0];
  const normalizedBase = base.startsWith('/') ? base : `/${base}`;
  if (SWITCH_TAB_PATHS.has(normalizedBase)) {
    uni.switchTab({ url: normalizedBase });
    return;
  }
  if (normalizedBase.startsWith('/pages/')) {
    uni.navigateTo({ url: raw.startsWith('/') ? raw : `/${raw}` });
    return;
  }
  openLink(raw, title);
};

const handleAvatarClick = () => {
  uni.showActionSheet({
    itemList: ['View Profile', 'Log Out'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.switchTab({ url: '/pages/user/index' });
      } else if (res.tapIndex === 1) {
        uni.showModal({
          title: 'Log Out',
          content: 'Are you sure you want to log out?',
          success: (r) => {
            if (r.confirm) {
              clearAuthState();
              userInfo.value = { nickname: '', avatarUrl: '', avatarViewUrl: '' };
              uni.reLaunch({ url: LOGIN_PAGE });
            }
          },
        });
      }
    },
  });
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #e8eef5;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  padding-bottom: env(safe-area-inset-bottom);
}

.status-spacer { width: 100%; }

/* ---- Top bar ---- */
.top-bar { display: flex; align-items: center; padding: 8px 20px 0; gap: 12px; }
.search-bar {
  flex: 1; display: flex; align-items: center;
  height: 42px; background: #ffffff;
  border: 1px solid #b8c8d8; border-radius: 14px;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}
.search-icon-wrap { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; margin-right: 6px; }
.search-icon-svg { font-size: 14px; }
.search-input { flex: 1; font-size: var(--font-body); color: #0f172a; height: 38px; }
.search-ph { color: #94a3b8; font-size: var(--font-body); }
.search-clear { padding: 4px; }
.clear-icon { font-size: 18px; color: #94a3b8; line-height: 1; }
.user-avatar { width: 36px; height: 36px; border-radius: 18px; background: #e2e8f0; flex-shrink: 0; }

/* ---- Greeting ---- */
.greeting-row { padding: 18px 20px 6px; }
.greeting-kicker {
  display: block; font-size: 11px; font-weight: 700;
  color: var(--primary-color); letter-spacing: 0.08em;
  text-transform: uppercase; margin-bottom: 6px;
}
.greeting-title { display: block; font-size: var(--font-hero); line-height: 1.12; font-weight: 800; color: var(--text-primary); }
.greeting-text { display: block; margin-top: 8px; font-size: var(--font-body); line-height: 1.5; color: var(--text-secondary); }

/* ---- Feature grid ---- */
.feature-grid { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 20px 8px; }
.feature-item {
  width: calc(50% - 6px);
  display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
  background: #ffffff;
  border: 1px solid #b8c8d8;
  border-radius: 16px; padding: 16px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
  box-sizing: border-box;
}
.feature-icon {
  width: 56px; height: 56px; border-radius: 18px;
  display: flex; justify-content: center; align-items: center;
  transition: transform 0.15s ease;
  transform: translateZ(0);
}
.feature-icon:active { transform: scale(0.92); }
.fi-char { font-size: 26px; }
.icon-assess   { background: linear-gradient(145deg, #b8d4ff, #85aef5); box-shadow: 0 4px 12px rgba(37,99,235,0.22); }
.icon-map      { background: linear-gradient(145deg, #c0ccff, #96a8f0); box-shadow: 0 4px 12px rgba(99,102,241,0.22); }
.icon-ai       { background: linear-gradient(145deg, #e8c4ff, #cc80f0); box-shadow: 0 4px 12px rgba(168,85,247,0.22); }
.icon-interview{ background: linear-gradient(145deg, #ffc89a, #ffaa5a); box-shadow: 0 4px 12px rgba(249,115,22,0.22); }
.feature-label { font-size: var(--font-body); font-weight: 700; color: #1e293b; line-height: 1.25; min-height: 36px; }

.agent-card {
  margin: 16px 20px 0;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #172554, #2563eb 58%, #38bdf8);
  box-shadow: 0 8px 22px rgba(37,99,235,0.28), 0 2px 8px rgba(15,23,42,0.16);
  box-sizing: border-box;
}
.agent-card-head { display: flex; align-items: center; gap: 10px; }
.agent-icon-wrap {
  width: 42px; height: 42px; border-radius: 15px;
  background: rgba(255,255,255,0.16);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.agent-icon { font-size: 21px; }
.agent-head-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.agent-kicker { font-size: 10px; font-weight: 800; color: #bfdbfe; letter-spacing: 0.08em; text-transform: uppercase; }
.agent-title { font-size: 17px; line-height: 1.25; font-weight: 900; color: #ffffff; }
.risk-pill { border-radius: 999px; padding: 5px 8px; background: rgba(255,255,255,0.18); flex-shrink: 0; }
.risk-high { background: rgba(254,202,202,0.28); }
.risk-medium { background: rgba(254,240,138,0.24); }
.risk-low { background: rgba(187,247,208,0.22); }
.risk-text { font-size: 10px; font-weight: 900; color: #ffffff; }
.agent-progress { margin-top: 14px; display: flex; align-items: center; gap: 10px; }
.agent-progress-bar {
  flex: 1; height: 7px; border-radius: 999px;
  background: rgba(255,255,255,0.22); overflow: hidden;
}
.agent-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #f8fafc, #bae6fd); }
.agent-progress-text { font-size: 11px; font-weight: 700; color: #dbeafe; }
.agent-focus { display: block; margin-top: 12px; font-size: 14px; line-height: 1.45; font-weight: 800; color: #ffffff; }
.agent-reason { display: block; margin-top: 6px; font-size: 12px; line-height: 1.55; color: #dbeafe; }
.risk-watch-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(15,23,42,0.26);
  border: 1px solid rgba(255,255,255,0.16);
}
.risk-watch-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.risk-watch-kicker { font-size: 10px; font-weight: 900; color: #bfdbfe; letter-spacing: 0.08em; text-transform: uppercase; }
.risk-watch-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.risk-watch-level,
.risk-watch-trend {
  border-radius: 999px;
  padding: 4px 7px;
  font-size: 10px;
  font-weight: 900;
  color: #ffffff;
  background: rgba(255,255,255,0.14);
}
.risk-watch-high { background: rgba(248,113,113,0.35); }
.risk-watch-medium { background: rgba(250,204,21,0.28); }
.risk-watch-low { background: rgba(34,197,94,0.28); }
.risk-watch-title { display: block; margin-top: 8px; font-size: 14px; font-weight: 900; color: #ffffff; line-height: 1.35; }
.risk-watch-summary { display: block; margin-top: 5px; font-size: 11.5px; color: #dbeafe; line-height: 1.45; }
.risk-watch-next { display: block; margin-top: 7px; font-size: 11.5px; color: #e0f2fe; line-height: 1.45; font-weight: 700; }
.agent-plan-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.16);
}
.agent-plan-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.agent-plan-kicker { font-size: 10px; font-weight: 900; color: #bfdbfe; letter-spacing: 0.08em; text-transform: uppercase; }
.agent-plan-health {
  border-radius: 999px;
  padding: 4px 7px;
  font-size: 10px;
  font-weight: 900;
  color: #ffffff;
  background: rgba(255,255,255,0.14);
}
.agent-plan-on_track { background: rgba(34,197,94,0.28); }
.agent-plan-needs_refresh { background: rgba(250,204,21,0.28); }
.agent-plan-missing { background: rgba(248,113,113,0.32); }
.agent-plan-title { display: block; margin-top: 8px; font-size: 14px; line-height: 1.35; font-weight: 900; color: #ffffff; }
.agent-plan-milestone { display: block; margin-top: 5px; font-size: 12px; line-height: 1.4; color: #e0f2fe; font-weight: 700; }
.agent-plan-focus-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.agent-plan-focus { font-size: 11.5px; line-height: 1.4; color: #dbeafe; }
.agent-plan-reason { display: block; margin-top: 7px; font-size: 11px; line-height: 1.45; color: #bfdbfe; }
.agent-plan-action {
  align-self: flex-start;
  margin-top: 10px;
  border-radius: 999px;
  padding: 7px 11px;
  background: #ffffff;
}
.agent-plan-action-text { font-size: 12px; font-weight: 900; color: #1d4ed8; }
.agent-pct-row {
  display: flex; align-items: center; gap: 8px; margin: 8px 0 4px;
}
.agent-pct-bar-wrap {
  flex: 1; height: 5px; background: rgba(255,255,255,.22); border-radius: 3px; overflow: hidden;
}
.agent-pct-bar-fill {
  height: 100%; border-radius: 3px; transition: width .4s ease;
}
.agent-pct-low   { background: #94a3b8; }
.agent-pct-medium { background: #38bdf8; }
.agent-pct-high  { background: #34d399; }
.agent-pct-label { font-size: 10.5px; color: rgba(255,255,255,.72); white-space: nowrap; flex: 1; }
.agent-pct-arrow { font-size: 14px; color: rgba(255,255,255,.55); margin-left: 2px; }
.agent-missing-row { margin: 6px 0 2px; }
.agent-missing-label { font-size: 10.5px; color: rgba(255,255,255,.60); margin-bottom: 5px; display: block; }
.agent-missing-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.agent-missing-chip {
  background: rgba(255,255,255,.14); border-radius: 12px; padding: 3px 10px;
}
.agent-missing-chip-text { font-size: 11px; color: #bfdbfe; font-weight: 600; }
.agent-risks { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.agent-risk-item { font-size: 11.5px; line-height: 1.4; color: #e0f2fe; }
.agent-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 13px; }
.agent-action {
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.22);
}
.agent-action-primary { background: #ffffff; border-color: #ffffff; }
.agent-action-text { font-size: 12px; font-weight: 800; color: #e0f2fe; }
.agent-action-primary .agent-action-text { color: #1d4ed8; }
.agent-task-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.agent-task-row {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  padding: 10px;
}
.agent-task-done { opacity: 0.68; }
.agent-task-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.agent-task-title-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.agent-task-title { font-size: 13px; font-weight: 900; color: #ffffff; line-height: 1.35; }
.agent-task-source {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 2px 6px;
  background: rgba(255,255,255,0.18);
  font-size: 9px;
  font-weight: 900;
  color: #e0f2fe;
}
.agent-task-desc { font-size: 11px; line-height: 1.4; color: #dbeafe; }
.agent-task-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.agent-task-btn {
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(255,255,255,0.14);
}
.agent-task-complete { background: #ffffff; }
.agent-task-btn-text { font-size: 11px; font-weight: 900; color: #e0f2fe; }
.agent-task-complete .agent-task-btn-text { color: #1d4ed8; }

.agent-hub-entry {
  margin-top: 14px;
  border: 1.5px solid rgba(255,255,255,0.4);
  border-radius: 999px; padding: 10px 0; text-align: center;
  background: rgba(255,255,255,0.12);
}
.agent-hub-entry-text { font-size: 13px; font-weight: 700; color: #fff; }

/* ---- Daily check-in chip ---- */
.checkin-card {
  display: flex; align-items: center; justify-content: space-between;
  margin: 16px 20px 0; padding: 14px 16px;
  background: linear-gradient(135deg, #a8e8f8, #5ecde8 60%, #30b8d8);
  border: 1px solid #38b0cc; border-radius: var(--radius-md);
  box-shadow: 0 4px 14px rgba(6,182,212,0.30), 0 1px 4px rgba(0,0,0,0.10);
}
.checkin-card:active { transform: scale(0.99); }
.checkin-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.checkin-kicker {
  font-size: 10px; font-weight: 700; color: #054260;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.checkin-title { font-size: 18px; font-weight: 800; color: #021e30; line-height: 1.1; }
.checkin-sub { font-size: 12px; color: #063a52; margin-top: 2px; }
.checkin-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  min-width: 110px;
}
.checkin-bar {
  width: 96px; height: 6px; border-radius: 3px;
  background: rgba(14, 116, 144, 0.18); overflow: hidden;
}
.checkin-bar-fill {
  height: 100%; background: linear-gradient(90deg, #0891b2, #06b6d4);
  border-radius: 3px; transition: width 0.3s ease;
}
.checkin-cta { font-size: 12px; font-weight: 700; color: #043650; }
.checkin-tip {
  margin: 6px 20px 0; padding: 6px 14px;
  font-size: 11.5px; color: #64748b; line-height: 1.4;
}
.checkin-tip-text { font-size: 11.5px; color: #64748b; }

/* ---- Generic section header ---- */
.section { padding: 24px 0 0; }
.section-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 0 20px; margin-bottom: 14px; gap: 12px;
}
.section-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.section-title { font-size: var(--font-title); font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
.section-meta { font-size: var(--font-caption); color: var(--text-tertiary); }
.section-more { display: flex; align-items: center; gap: 4px; min-height: 32px; padding: 0 6px; }
.section-more-text { font-size: 13px; color: #2563eb; font-weight: 600; }
.section-more-arrow { font-size: 16px; color: #2563eb; line-height: 1; }

/* ---- Reusable cover tints (used when no image) ---- */
.cover-tone-0 { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.cover-tone-1 { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); }
.cover-tone-2 { background: linear-gradient(135deg, #fae8ff, #f0abfc); }
.cover-tone-3 { background: linear-gradient(135deg, #ffedd5, #fed7aa); }

/* ---- Horizontal scroller (used by videos) ---- */
.hscroll { width: 100%; white-space: nowrap; }
.hscroll-track { display: inline-flex; padding: 0 20px 4px; gap: 16px; padding-right: 40px; }

/* ---- Video card ---- */
.video-card {
  display: inline-flex; flex-direction: column;
  width: 240px; flex-shrink: 0;
  background: #ffffff; border-radius: var(--radius-md);
  overflow: hidden; border: 1px solid #b8c8d8;
  box-shadow: 0 3px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
  transition: transform 0.15s;
}
.video-card:active { transform: scale(0.98); }
.video-cover { width: 100%; height: 134px; position: relative; overflow: hidden; background: #e2e8f0; }
.video-cover-img { width: 100%; height: 100%; display: block; }
.duration-badge {
  position: absolute; bottom: 8px; right: 8px;
  background: rgba(0,0,0,0.55); padding: 2px 8px; border-radius: 6px;
}
.duration-text { color: #fff; font-size: 11px; font-weight: 600; }
.play-icon-wrap {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 40px; height: 40px; border-radius: 20px; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.play-icon { font-size: 14px; color: #fff; margin-left: 2px; }
.video-body { padding: 10px 14px 14px; white-space: normal; }
.video-title {
  font-size: var(--font-body); font-weight: 600; color: #1e293b; line-height: 1.4;
  margin-bottom: 6px; display: -webkit-box;
  line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; height: 38px;
}
.video-meta-row { display: flex; align-items: center; gap: 4px; }
.video-up { font-size: 12px; color: #2563eb; font-weight: 600; }
.video-views { font-size: 12px; color: #94a3b8; }

/* ---- Article cards (vertical list) ---- */
.article-list { display: flex; flex-direction: column; gap: 12px; padding: 0 20px; }
.article-card {
  display: flex; align-items: stretch; gap: 14px;
  background: #ffffff; border: 1px solid #b8c8d8;
  border-radius: var(--radius-md); padding: 14px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
  transition: transform 0.15s;
}
.article-card:active { transform: scale(0.99); }
.article-cover {
  width: 96px; height: 96px; flex-shrink: 0;
  border-radius: 12px; overflow: hidden;
}
.article-cover-img { width: 100%; height: 100%; display: block; }
.article-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.article-title {
  font-size: var(--font-body); font-weight: 700; color: #0f172a;
  display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35;
}
.article-summary {
  font-size: var(--font-caption); color: #64748b; line-height: 1.45;
  display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.article-tag {
  align-self: flex-start; margin-top: 4px;
  background: #eff6ff; padding: 3px 8px; border-radius: 6px;
}
.article-tag-text { font-size: 10px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.04em; }

/* ---- Consultation cards ---- */
.consult-list { display: flex; flex-direction: column; gap: 12px; padding: 0 20px; }
.consult-card {
  background: #ffffff; border: 1px solid #b8c8d8;
  border-radius: var(--radius-md); padding: 14px 16px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
  display: flex; flex-direction: column; gap: 6px;
}
.consult-head { display: flex; flex-direction: column; gap: 4px; }
.consult-title { font-size: var(--font-body); font-weight: 700; color: #0f172a; line-height: 1.3; }
.consult-author { font-size: 11px; color: #94a3b8; font-weight: 500; }
.consult-body { font-size: var(--font-caption); color: #475569; line-height: 1.55; white-space: pre-line; }
.consult-link-hint { font-size: 12px; color: #2563eb; margin-top: 6px; font-weight: 500; }

/* ---- Career path spotlight ---- */
.path-grid { display: flex; flex-wrap: wrap; gap: 12px; padding: 0 20px; }
.path-card {
  width: calc(50% - 6px); box-sizing: border-box;
  border-radius: var(--radius-md); padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
  background: #ffffff;
  border: 1px solid #b8c8d8;
  box-shadow: 0 3px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
}
.path-name { font-size: var(--font-body); font-weight: 700; color: #0f172a; }
.path-desc {
  font-size: var(--font-caption); color: #475569; line-height: 1.45;
  display: -webkit-box; line-clamp: 3; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}

/* ---- Empty / safe area ---- */
.empty-state { text-align: center; padding: 60px 20px 20px; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 16px; }
.empty-text { font-size: 15px; color: #64748b; font-weight: 500; display: block; margin-bottom: 24px; }
.btn-clear {
  background: #2563eb; color: #fff; font-size: 14px; font-weight: 600;
  border-radius: 12px; height: 40px; line-height: 40px; border: none; width: 140px;
}
.bottom-safe { height: calc(var(--tab-bar-height, 50px) + 20px); }

/* ---- Dark Mode ---- */
.is-dark { background-color: #0f172a; }
.is-dark .search-bar { background: #1e293b; box-shadow: none; }
.is-dark .search-input { color: #f8fafc; }
.is-dark .feature-label { color: #e2e8f0; }
.is-dark .feature-item { background: #1e293b; box-shadow: none; border-color: #334155; }
.is-dark .section-title { color: #f8fafc; }
.is-dark .video-card,
.is-dark .article-card,
.is-dark .consult-card,
.is-dark .path-card { background: #1e293b; box-shadow: none; border-color: #334155; }
.is-dark .checkin-card { background: linear-gradient(135deg, #082f49, #0c4a6e); border-color: #0e7490; }
.is-dark .checkin-kicker { color: #67e8f9; }
.is-dark .checkin-title { color: #f0f9ff; }
.is-dark .checkin-sub { color: #bae6fd; }
.is-dark .checkin-cta { color: #67e8f9; }
.is-dark .checkin-tip-text { color: #94a3b8; }
.is-dark .article-tag { background: #172554; }
.is-dark .article-tag-text,
.is-dark .section-more-text,
.is-dark .section-more-arrow,
.is-dark .video-up,
.is-dark .consult-link-hint { color: #93c5fd; }
.is-dark .video-title,
.is-dark .article-title,
.is-dark .consult-title,
.is-dark .path-name { color: #f8fafc; }
.is-dark .article-summary,
.is-dark .consult-body,
.is-dark .path-desc { color: #94a3b8; }

/* ================================================================
 *  MP-WEIXIN parity overrides — HARDCODED values, no CSS vars.
 *  CSS custom properties set on :root / page may not cascade into
 *  scoped component styles in the mini-program runtime, so we
 *  bypass var() entirely and write concrete values here.
 * ================================================================ */
/* #ifdef MP-WEIXIN */

/* ---- Page background: slightly more contrast vs. white cards ---- */
.home-page {
  background-color: #eaeff5;
}

.is-dark.home-page {
  background-color: #0f172a;
}

/* ---- Feature grid cards ---- */
.feature-item {
  overflow: visible;
  background: #ffffff;
  border: 1.5px solid #b0bfd0;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.22),
              0 2px 6px  rgba(0,0,0,0.14);
}

/* ---- Icon pills: force GPU compositing to fix blurry border-radius ---- */
.feature-icon {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
}

/* ---- Stronger icon-background colours ---- */
.icon-assess   { background: linear-gradient(145deg, #c3d8ff, #93b8ff); box-shadow: 0 4px 14px rgba(37,99,235,0.28); }
.icon-map      { background: linear-gradient(145deg, #ccd5ff, #a5b3fa); box-shadow: 0 4px 14px rgba(99,102,241,0.28); }
.icon-ai       { background: linear-gradient(145deg, #eed4ff, #d68ef5); box-shadow: 0 4px 14px rgba(168,85,247,0.28); }
.icon-interview{ background: linear-gradient(145deg, #ffd7b0, #ffb96a); box-shadow: 0 4px 14px rgba(249,115,22,0.28); }

/* ---- Search bar ---- */
.search-bar {
  background: #ffffff;
  border: 1.5px solid #b0bfd0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

/* ---- Daily check-in card ---- */
.checkin-card {
  overflow: visible;
  background: linear-gradient(135deg, #baeeff, #7dd8f5 60%, #4dc4ea);
  border: 1.5px solid #45b8d8;
  box-shadow: 0 4px 16px rgba(6,182,212,0.30),
              0 2px 6px  rgba(0,0,0,0.10);
}
.checkin-kicker { color: #065278; }
.checkin-title  { color: #031e2f; }
.checkin-sub    { color: #084d6a; }
.checkin-cta    { color: #065278; }

/* ---- Article / consult / path cards ---- */
.article-card,
.consult-card {
  overflow: visible;
  border: 1.5px solid #b0bfd0;
  box-shadow: 0 3px 14px rgba(0,0,0,0.18),
              0 1px 5px  rgba(0,0,0,0.10);
}

.path-card {
  overflow: visible;
  border: 1.5px solid #b0bfd0;
  box-shadow: 0 3px 14px rgba(0,0,0,0.18),
              0 1px 5px  rgba(0,0,0,0.10);
}

/* ---- Video cards: overflow:hidden must stay for image clipping,
        so use filter:drop-shadow which renders outside the layer ---- */
.video-card {
  overflow: hidden;
  box-shadow: none;
  filter: drop-shadow(0 3px 12px rgba(0,0,0,0.22));
}

.home-page.is-dark .feature-item {
  background: #1e293b;
  border-color: #334155;
  box-shadow: none;
}

.home-page.is-dark .search-bar {
  background: #1e293b;
  border-color: #334155;
  box-shadow: none;
}

.home-page.is-dark .checkin-card {
  background: linear-gradient(135deg, #082f49, #0c4a6e);
  border-color: #0e7490;
  box-shadow: none;
}

.home-page.is-dark .checkin-kicker { color: #67e8f9; }
.home-page.is-dark .checkin-title { color: #f0f9ff; }
.home-page.is-dark .checkin-sub { color: #bae6fd; }
.home-page.is-dark .checkin-cta { color: #67e8f9; }

.home-page.is-dark .article-card,
.home-page.is-dark .consult-card,
.home-page.is-dark .path-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: none;
}

.home-page.is-dark .video-card {
  background: #1e293b;
  border-color: #334155;
}

/* #endif */
</style>
