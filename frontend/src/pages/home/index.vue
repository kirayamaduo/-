<template>
  <view class="home-page app-gradient-bg" :class="[themeClass, fontClass]">
    <SlScrollTopBar :title="t('nav.home')" :opacity="topBarOpacity" :safe-top="topSafeHeight" :right-avoid-width="rightAvoidWidth" />
    <view class="status-spacer" :style="{ height: topSafeHeight + 'px' }"></view>

    <view class="top-bar" :style="{ paddingRight: rightAvoidWidth + 'px' }">
      <image
        class="user-avatar"
        :src="avatarSrc"
        mode="aspectFill"
        @click="handleAvatarClick"
      />
      <view class="search-bar app-surface">
        <view class="search-icon-wrap" @click="onSearch">
          <text class="search-icon-svg ri-search-line"></text>
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
    </view>

    <view class="greeting-row">
      <text class="greeting-kicker">Career Loop</text>
      <text class="greeting-title">Hello, {{ userInfo.nickname || 'Guest' }}</text>
      <text class="greeting-text">{{ t('home.pullToRefresh') }}</text>
    </view>

    <view class="feature-grid">
      <view class="feature-item app-card-soft" @click="navTo('/pages/assessment/index')">
        <view class="app-icon-tile app-icon-tile--cyan">
          <text class="fi-char ri-compass-3-line"></text>
        </view>
        <text class="feature-label">{{ t('home.featureAssessment') }}</text>
      </view>
      <view class="feature-item app-card-soft" @click="navTo('/pages/map/index')">
        <view class="app-icon-tile app-icon-tile--violet">
          <text class="fi-char ri-map-2-line"></text>
        </view>
        <text class="feature-label">{{ t('home.featureSkillMap') }}</text>
      </view>
      <view class="feature-item app-card-soft" @click="navTo('/pages/resume-ai/index')">
        <view class="app-icon-tile app-icon-tile--candy">
          <text class="fi-char ri-sparkling-line"></text>
        </view>
        <text class="feature-label">{{ t('home.featureAiResume') }}</text>
      </view>
      <view class="feature-item app-card-soft" @click="navTo('/pages/interview/start')">
        <view class="app-icon-tile app-icon-tile--warning">
          <text class="fi-char ri-mic-2-line"></text>
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

    <view v-if="agentToday" class="agent-card app-card-soft app-surface">
      <view class="agent-card-head">
        <view class="agent-icon-wrap">
          <text class="agent-icon ri-robot-2-line"></text>
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
            class="video-card app-surface"
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
          class="article-card app-surface"
          v-for="(a, idx) in filteredArticles"
          :key="a.id"
          @click="openArticle(a)"
        >
          <view class="article-cover" :class="'cover-tone-' + (idx % 4)">
            <view v-if="articleSourceRemixIcon(a)" class="article-source-icon">
              <text class="article-source-glyph" :class="articleSourceRemixIcon(a)"></text>
            </view>
            <image
              v-else
              class="article-cover-img"
              :src="articleImageSrc(a, idx)"
              :mode="articleImageMode(a)"
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
          class="consult-card app-surface"
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
          class="path-card app-card-soft"
          v-for="(p, idx) in filteredCareerCards"
          :key="p.pathId"
          @click="navTo('/pages/map/index?pathId=' + p.pathId)"
        >
          <view class="path-icon-wrap" :class="'tone-' + (idx % 4)">
            <text class="path-icon-glyph ri-map-pin-user-line"></text>
          </view>
          <text class="path-name">{{ p.name }}</text>
          <text class="path-desc">{{ p.description }}</text>
        </view>
      </view>
    </view>

    <view class="empty-state app-empty app-surface"
          v-if="searchQuery && filteredVideos.length === 0 && filteredArticles.length === 0 && filteredConsultations.length === 0 && filteredCareerCards.length === 0">
      <text class="empty-icon ri-search-line"></text>
      <text class="empty-text">{{ t('home.searchEmpty', { q: searchQuery }) }}</text>
      <button class="btn-clear" @click="clearSearch">{{ t('home.searchClear') }}</button>
    </view>

    <view class="empty-state app-empty app-surface"
          v-if="!searchQuery && homeError">
      <text class="empty-icon ri-alert-line"></text>
      <text class="empty-text">{{ homeError }}</text>
      <button class="btn-clear" @click="loadHomeContent">{{ t('common.retry') }}</button>
    </view>

    <view class="bottom-safe"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from '@/locales';
import { onShow, onPullDownRefresh, onPageScroll } from '@dcloudio/uni-app';
import { openLink } from '@/utils/openLink';
import {
  getHomeContentApi,
  refreshHomeContentApi,
  type BiliVideoCard,
  type HomeArticle,
  type HomeConsultation,
  type CareerCard,
} from '@/api/home';
import { getCheckInStatusApi, type CheckInStatus } from '@/api/checkin';
import {
  getAgentBundleApi,
  completeAgentTaskApi,
  dismissAgentTaskApi,
  type CareerAgentToday,
  type AgentTask,
  type AgentUserProfile,
} from '@/api/agent';
import { clearAuthState, LOGIN_PAGE } from '@/utils/auth';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import { useTheme } from '@/utils/theme';
import SlScrollTopBar from '@/style-library/components/SlScrollTopBar.vue';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
const rightAvoidWidth = ref(20);
const scrollTopValue = ref(0);
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

const filterBySearch = <T>(list: T[]) => {
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter((item: any) => {
    if (item.title) return matches(item.title, q);
    if (item.upName) return matches(item.upName, q);
    if (item.keyword) return matches(item.keyword, q);
    if (item.summary) return matches(item.summary, q);
    if (item.category) return matches(item.category, q);
    if (item.body) return matches(item.body, q);
    if (item.author) return matches(item.author, q);
    return false;
  });
};

const filteredVideos = computed(() => filterBySearch(videos.value));
const filteredArticles = computed(() => filterBySearch(articles.value));
const topBarOpacity = computed(() => Math.min(1, Math.max(0, (scrollTopValue.value - 12) / 56)));

/**
 * Local fallback covers guarantee that article cards always have an image,
 * even when remote URLs expire (e.g. seeded 3rd-party links returning 404).
 */
const ARTICLE_FALLBACK_COVERS = [
  '/static/logo.png',
];
const articleImageStageMap = ref<Record<number, number>>({});

const fallbackByIndex = (idx: number) =>
  ARTICLE_FALLBACK_COVERS[Math.abs(idx) % ARTICLE_FALLBACK_COVERS.length];

const extractOrigin = (raw?: string): string => {
  const match = raw?.match(/^https?:\/\/[^/]+/i);
  return match?.[0] || '';
};

const extractHost = (raw?: string): string => {
  return extractOrigin(raw).replace(/^https?:\/\//i, '').replace(/^www\./i, '');
};

const articleSourceText = (a: HomeArticle): string => {
  const anyArticle = a as HomeArticle & { source?: string; sourceName?: string; publisher?: string };
  return [
    anyArticle.sourceName,
    anyArticle.source,
    anyArticle.publisher,
    extractHost(a.sourceUrl || a.url),
    a.category,
  ].filter(Boolean).join(' ').toLowerCase();
};

const ARTICLE_SOURCE_ICON_RULES: Array<[RegExp, string]> = [
  [/linkedin/, 'ri-linkedin-box-fill'],
  [/github/, 'ri-github-fill'],
  [/zhihu|知乎/, 'ri-zhihu-line'],
  [/wechat|weixin|微信|公众号/, 'ri-wechat-fill'],
  [/medium/, 'ri-medium-fill'],
  [/youtube|youtu\.be/, 'ri-youtube-fill'],
  [/bilibili|b23\.tv|哔哩|b站/, 'ri-bilibili-fill'],
  [/twitter|x\.com/, 'ri-twitter-x-fill'],
  [/google/, 'ri-google-fill'],
  [/microsoft|linkedin/, 'ri-microsoft-fill'],
  [/apple/, 'ri-apple-fill'],
  [/stack\s*overflow|stackoverflow/, 'ri-stack-overflow-fill'],
  [/reddit/, 'ri-reddit-fill'],
];

const articleSourceRemixIcon = (a: HomeArticle): string => {
  const sourceText = articleSourceText(a);
  if (!sourceText) return '';
  return ARTICLE_SOURCE_ICON_RULES.find(([rule]) => rule.test(sourceText))?.[1] || '';
};

const articleSourceIconSrc = (a: HomeArticle): string => {
  if (a.sourceIconUrl) return a.sourceIconUrl;
  const origin = extractOrigin(a.sourceUrl || a.url);
  return origin ? `${origin}/favicon.ico` : '';
};

const articleThumbnailSrc = (a: HomeArticle): string => {
  if (a.thumbnailUrl) return a.thumbnailUrl;
  if (a.imageUrl) return a.imageUrl;
  if (a.sourceUrl) return `${API_BASE_URL}/api/homepage/articles/${a.id}/cover`;
  return '';
};

const articleImageSrc = (a: HomeArticle, idx: number): string => {
  const stage = articleImageStageMap.value[a.id] || 0;
  const sourceIcon = articleSourceIconSrc(a);
  const thumbnail = articleThumbnailSrc(a);
  if (stage <= 0 && sourceIcon) return sourceIcon;
  if (stage <= 1 && thumbnail) return thumbnail;
  return fallbackByIndex(idx);
};

const articleImageMode = (a: HomeArticle): 'aspectFill' | 'aspectFit' => {
  return (articleImageStageMap.value[a.id] || 0) === 0 && !!articleSourceIconSrc(a) ? 'aspectFit' : 'aspectFill';
};

const onArticleImageError = (id: number) => {
  articleImageStageMap.value[id] = Math.min((articleImageStageMap.value[id] || 0) + 1, 2);
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
    uni.showToast({ title: t('home.noLinkAttached'), icon: 'none' });
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
    homeError.value = e?.message || t('home.contentLoadFailed');
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
    uni.showToast({ title: t('agent.hub.completeSuccess'), icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('common.failed'), icon: 'none' });
  }
};

const dismissAgentTask = async (taskId: number) => {
  try {
    await dismissAgentTaskApi(taskId);
    agentTasks.value = agentTasks.value.filter((task) => task.taskId !== taskId);
    uni.showToast({ title: t('home.taskSkipped'), icon: 'none' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('common.failed'), icon: 'none' });
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
  const safeMetrics = getMpSafeAreaMetrics();
  topSafeHeight.value = safeMetrics.topSafeHeight;
  rightAvoidWidth.value = safeMetrics.rightAvoidWidth;
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
    uni.showToast({ title: t('common.refreshed'), icon: 'success' });
  } catch {
    uni.showToast({ title: t('common.refreshFailed'), icon: 'none' });
  } finally {
    uni.stopPullDownRefresh();
  }
});

onPageScroll(({ scrollTop }) => {
  scrollTopValue.value = scrollTop;
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
  if (n.startsWith('/pages/')) return t('home.tryIt');
  return t('home.readFull');
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
    itemList: [t('home.viewProfile'), t('home.logOut')],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.switchTab({ url: '/pages/user/index' });
      } else if (res.tapIndex === 1) {
        uni.showModal({
          title: t('home.logOut'),
          content: t('home.logOutConfirm'),
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
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.status-spacer { width: 100%; }

/* ---- Top bar ---- */
.top-bar { display: flex; align-items: center; padding: 8px 20px 0; gap: 12px; }
.search-bar {
  flex: 1; display: flex; align-items: center;
  height: 42px;
  border-radius: var(--btn-radius, 14px);
  padding: 0 16px;
}
.search-icon-wrap { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; margin-right: 6px; }
.search-icon-svg { font-size: 14px; }
.search-input { flex: 1; font-size: var(--font-body, 15px); color: var(--text-primary, #0f172a); height: 38px; }
.search-input { border: none; background: transparent; padding: 0; box-shadow: none; }
.search-ph { color: var(--text-tertiary, #8e8e93); font-size: var(--font-body, 15px); }
.search-clear { padding: 4px; }
.clear-icon { font-size: 18px; color: var(--text-tertiary, #8e8e93); line-height: 1; }
.user-avatar { width: 36px; height: 36px; border-radius: 18px; background: #e2e8f0; flex-shrink: 0; }

/* ---- Greeting ---- */
.greeting-row { padding: 18px 20px 6px; }
.greeting-kicker {
  display: block; font-size: 11px; font-weight: 700;
  color: var(--primary-color, #2563eb); letter-spacing: 0.08em;
  text-transform: uppercase; margin-bottom: 6px;
}
.greeting-title { display: block; font-size: var(--font-hero, 28px); line-height: 1.12; font-weight: 800; color: var(--text-primary, #0f172a); }
.greeting-text { display: block; margin-top: 8px; font-size: var(--font-body, 15px); line-height: 1.5; color: var(--text-secondary, #64748b); }

/* ---- Feature grid ---- */
.feature-grid { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 20px 8px; }
.feature-item {
  width: calc(50% - 6px);
  display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
  box-sizing: border-box;
  min-height: 104px;
  padding: 16px;
  border: none;
  box-shadow: none;
  color: #ffffff;
}
.feature-item:nth-child(1) { background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); }
.feature-item:nth-child(2) { background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); }
.feature-item:nth-child(3) { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); }
.feature-item:nth-child(4) { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); }
.feature-item .app-icon-tile {
  background: rgba(255,255,255,0.22);
  color: #ffffff;
}
.fi-char { font-size: 20px; }
.feature-label { font-size: var(--font-body, 15px); font-weight: 800; color: #ffffff; line-height: 1.25; min-height: 36px; }

.agent-card {
  margin: 16px 20px 0;
  background: var(--surface-1, #ffffff);
  color: var(--text-primary, #0f172a);
}
.agent-card-head { display: flex; align-items: center; gap: 10px; }
.agent-icon-wrap {
  width: 42px; height: 42px; border-radius: 15px;
  background: var(--primary-soft, #eff6ff);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.agent-icon { font-size: 21px; color: var(--primary-color, #2563eb); }
.agent-head-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.agent-kicker { font-size: 10px; font-weight: 800; color: var(--primary-color, #2563eb); letter-spacing: 0.08em; text-transform: uppercase; }
.agent-title { font-size: 17px; line-height: 1.25; font-weight: 900; color: var(--text-primary, #0f172a); }
.risk-pill { border-radius: 999px; padding: 5px 8px; background: var(--surface-3, #f1f5f9); flex-shrink: 0; }
.risk-high { background: #fee2e2; }
.risk-medium { background: #fef3c7; }
.risk-low { background: #dcfce7; }
.risk-text { font-size: 10px; font-weight: 900; color: var(--text-primary, #0f172a); }
.agent-progress { margin-top: 14px; display: flex; align-items: center; gap: 10px; }
.agent-progress-bar {
  flex: 1; height: 7px; border-radius: 999px;
  background: var(--surface-3, #f1f5f9); overflow: hidden;
}
.agent-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #2563eb, #38bdf8); }
.agent-progress-text { font-size: 11px; font-weight: 700; color: var(--text-secondary, #64748b); }
.agent-focus { display: block; margin-top: 12px; font-size: 14px; line-height: 1.45; font-weight: 800; color: var(--text-primary, #0f172a); }
.agent-reason { display: block; margin-top: 6px; font-size: 12px; line-height: 1.55; color: var(--text-secondary, #64748b); }
.risk-watch-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-2, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}
.risk-watch-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.risk-watch-kicker { font-size: 10px; font-weight: 900; color: var(--primary-color, #2563eb); letter-spacing: 0.08em; text-transform: uppercase; }
.risk-watch-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.risk-watch-level,
.risk-watch-trend {
  border-radius: 999px;
  padding: 4px 7px;
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary, #0f172a);
  background: var(--surface-3, #f1f5f9);
}
.risk-watch-high { background: #fee2e2; }
.risk-watch-medium { background: #fef3c7; }
.risk-watch-low { background: #dcfce7; }
.risk-watch-title { display: block; margin-top: 8px; font-size: 14px; font-weight: 900; color: var(--text-primary, #0f172a); line-height: 1.35; }
.risk-watch-summary { display: block; margin-top: 5px; font-size: 11.5px; color: var(--text-secondary, #64748b); line-height: 1.45; }
.risk-watch-next { display: block; margin-top: 7px; font-size: 11.5px; color: var(--primary-color, #2563eb); line-height: 1.45; font-weight: 700; }
.agent-plan-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-2, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}
.agent-plan-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.agent-plan-kicker { font-size: 10px; font-weight: 900; color: var(--primary-color, #2563eb); letter-spacing: 0.08em; text-transform: uppercase; }
.agent-plan-health {
  border-radius: 999px;
  padding: 4px 7px;
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary, #0f172a);
  background: var(--surface-3, #f1f5f9);
}
.agent-plan-on_track { background: #dcfce7; }
.agent-plan-needs_refresh { background: #fef3c7; }
.agent-plan-missing { background: #fee2e2; }
.agent-plan-title { display: block; margin-top: 8px; font-size: 14px; line-height: 1.35; font-weight: 900; color: var(--text-primary, #0f172a); }
.agent-plan-milestone { display: block; margin-top: 5px; font-size: 12px; line-height: 1.4; color: var(--text-primary, #0f172a); font-weight: 700; }
.agent-plan-focus-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.agent-plan-focus { font-size: 11.5px; line-height: 1.4; color: var(--text-secondary, #64748b); }
.agent-plan-reason { display: block; margin-top: 7px; font-size: 11px; line-height: 1.45; color: var(--text-secondary, #64748b); }
.agent-plan-action {
  align-self: flex-start;
  margin-top: 10px;
  border-radius: 999px;
  padding: 7px 11px;
  background: var(--primary-color, #2563eb);
}
.agent-plan-action-text { font-size: 12px; font-weight: 900; color: #ffffff; }
.agent-pct-row {
  display: flex; align-items: center; gap: 8px; margin: 8px 0 4px;
}
.agent-pct-bar-wrap {
  flex: 1; height: 5px; background: var(--surface-3, #f1f5f9); border-radius: 3px; overflow: hidden;
}
.agent-pct-bar-fill {
  height: 100%; border-radius: 3px; transition: width .4s ease;
}
.agent-pct-low   { background: #94a3b8; }
.agent-pct-medium { background: #38bdf8; }
.agent-pct-high  { background: #34d399; }
.agent-pct-label { font-size: 10.5px; color: var(--text-secondary, #64748b); white-space: nowrap; flex: 1; }
.agent-pct-arrow { font-size: 14px; color: var(--text-tertiary, #8e8e93); margin-left: 2px; }
.agent-missing-row { margin: 6px 0 2px; }
.agent-missing-label { font-size: 10.5px; color: var(--text-tertiary, #8e8e93); margin-bottom: 5px; display: block; }
.agent-missing-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.agent-missing-chip {
  background: var(--primary-soft, #eff6ff); border-radius: 12px; padding: 3px 10px;
}
.agent-missing-chip-text { font-size: 11px; color: var(--primary-color, #2563eb); font-weight: 600; }
.agent-risks { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.agent-risk-item { font-size: 11.5px; line-height: 1.4; color: var(--text-secondary, #64748b); }
.agent-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 13px; }
.agent-action {
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--surface-2, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}
.agent-action-primary { background: var(--primary-color, #2563eb); border-color: var(--primary-color, #2563eb); }
.agent-action-text { font-size: 12px; font-weight: 800; color: var(--text-primary, #0f172a); }
.agent-action-primary .agent-action-text { color: #ffffff; }
.agent-task-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.agent-task-row {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface-2, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 10px;
}
.agent-task-done { opacity: 0.68; }
.agent-task-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.agent-task-title-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.agent-task-title { font-size: 13px; font-weight: 900; color: var(--text-primary, #0f172a); line-height: 1.35; }
.agent-task-source {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 2px 6px;
  background: var(--surface-3, #f1f5f9);
  font-size: 9px;
  font-weight: 900;
  color: var(--text-secondary, #64748b);
}
.agent-task-desc { font-size: 11px; line-height: 1.4; color: var(--text-secondary, #64748b); }
.agent-task-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.agent-task-btn {
  border-radius: 999px;
  padding: 6px 9px;
  background: var(--surface-3, #f1f5f9);
}
.agent-task-complete { background: var(--primary-color, #2563eb); }
.agent-task-btn-text { font-size: 11px; font-weight: 900; color: var(--text-secondary, #64748b); }
.agent-task-complete .agent-task-btn-text { color: #ffffff; }

.agent-hub-entry {
  margin-top: 14px;
  border: 1.5px solid var(--border-color, #e2e8f0);
  border-radius: 999px; padding: 10px 0; text-align: center;
  background: var(--surface-2, #f8fafc);
}
.agent-hub-entry-text { font-size: 13px; font-weight: 700; color: var(--primary-color, #2563eb); }

/* ---- Daily check-in chip ---- */
.checkin-card {
  display: flex; align-items: center; justify-content: space-between;
  margin: 16px 20px 0; padding: 14px 16px;
  background: var(--gradient-success);
  border-radius: var(--radius-md, 16px);
  box-shadow: var(--shadow-sm);
  color: #fff;
}
.checkin-card:active { transform: scale(0.99); }
.checkin-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.checkin-kicker {
  font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.8);
  letter-spacing: 0.08em; text-transform: uppercase;
}
.checkin-title { font-size: 18px; font-weight: 800; color: #fff; line-height: 1.1; }
.checkin-sub { font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 2px; }
.checkin-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  min-width: 110px;
}
.checkin-bar {
  width: 96px; height: 6px; border-radius: 3px;
  background: rgba(255,255,255,0.3); overflow: hidden;
}
.checkin-bar-fill {
  height: 100%; background: #fff;
  border-radius: 3px; transition: width 0.3s ease;
}
.checkin-cta { font-size: 12px; font-weight: 700; color: #fff; }
.checkin-tip {
  margin: 6px 20px 0; padding: 6px 14px;
  font-size: 11.5px; color: var(--text-secondary, #64748b); line-height: 1.4;
}
.checkin-tip-text { font-size: 11.5px; color: var(--text-secondary, #64748b); }

/* ---- Generic section header ---- */
.section { padding: 24px 0 0; }
.section-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 0 20px; margin-bottom: 14px; gap: 12px;
}
.section-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.section-title { font-size: var(--font-title, 18px); font-weight: 700; color: var(--text-primary, #0f172a); letter-spacing: -0.3px; }
.section-meta { font-size: var(--font-caption, 13px); color: var(--text-tertiary, #8e8e93); }
.section-more { display: flex; align-items: center; gap: 4px; min-height: 32px; padding: 0 6px; }
.section-more-text { font-size: 13px; color: var(--primary-color, #2563eb); font-weight: 600; }
.section-more-arrow { font-size: 16px; color: var(--primary-color, #2563eb); line-height: 1; }

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
  border-radius: var(--radius-md, 16px);
  overflow: hidden;
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
  font-size: var(--font-body, 15px); font-weight: 600; color: var(--text-primary, #0f172a); line-height: 1.4;
  margin-bottom: 6px; display: -webkit-box;
  line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; height: 38px;
}
.video-meta-row { display: flex; align-items: center; gap: 4px; }
.video-up { font-size: 12px; color: var(--primary-color, #2563eb); font-weight: 600; }
.video-views { font-size: 12px; color: var(--text-tertiary, #8e8e93); }

/* ---- Article cards (vertical list) ---- */
.article-list { display: flex; flex-direction: column; gap: 12px; padding: 0 20px; }
.article-card {
  display: flex; align-items: stretch; gap: 14px;
  border-radius: var(--radius-md, 16px); padding: 14px;
  transition: transform 0.15s;
}
.article-card:active { transform: scale(0.99); }
.article-cover {
  width: 96px; height: 96px; flex-shrink: 0;
  border-radius: 12px; overflow: hidden;
  background: var(--surface-2, #f8fafc);
}
.article-source-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.article-source-glyph {
  font-size: 34px;
  color: var(--primary-color, #2563eb);
}
.article-cover-img { width: 100%; height: 100%; display: block; }
.article-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.article-title {
  font-size: var(--font-body, 15px); font-weight: 700; color: var(--text-primary, #0f172a);
  display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35;
}
.article-summary {
  font-size: var(--font-caption, 13px); color: var(--text-secondary, #64748b); line-height: 1.45;
  display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.article-tag {
  align-self: flex-start; margin-top: 4px;
  background: var(--primary-soft, #eff6ff); padding: 3px 8px; border-radius: 6px;
}
.article-tag-text { font-size: 10px; font-weight: 700; color: var(--primary-color, #2563eb); text-transform: uppercase; letter-spacing: 0.04em; }

/* ---- Consultation cards ---- */
.consult-list { display: flex; flex-direction: column; gap: 12px; padding: 0 20px; }
.consult-card {
  border-radius: var(--radius-md, 16px); padding: 14px 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.consult-head { display: flex; flex-direction: column; gap: 4px; }
.consult-title { font-size: var(--font-body, 15px); font-weight: 700; color: var(--text-primary, #0f172a); line-height: 1.3; }
.consult-author { font-size: 11px; color: var(--text-tertiary, #8e8e93); font-weight: 500; }
.consult-body { font-size: var(--font-caption, 13px); color: var(--text-secondary, #64748b); line-height: 1.55; white-space: pre-line; }
.consult-link-hint { font-size: 12px; color: var(--primary-color, #2563eb); margin-top: 6px; font-weight: 500; }

/* ---- Career path spotlight ---- */
.path-grid { display: flex; flex-wrap: wrap; gap: 12px; padding: 0 20px; }
.path-card {
  width: calc(50% - 6px); box-sizing: border-box;
  border-radius: var(--radius-md, 16px); padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
  background: var(--surface-1, #ffffff);
}
.path-icon-wrap {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.path-icon-glyph { font-size: 16px; font-weight: 800; }
.tone-0 { background: var(--primary-soft, #eff6ff); color: var(--primary-color, #2563eb); }
.tone-1 { background: #f3e8ff; color: #9333ea; }
.tone-2 { background: #e0e7ff; color: #4f46e5; }
.tone-3 { background: #ffedd5; color: #ea580c; }
.path-name { font-size: var(--font-body, 15px); font-weight: 700; color: var(--text-primary, #0f172a); }
.path-desc {
  font-size: var(--font-caption, 13px); color: var(--text-secondary, #64748b); line-height: 1.45;
  display: -webkit-box; line-clamp: 3; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}

/* ---- Empty / safe area ---- */
.empty-state { text-align: center; padding: 60px 20px 20px; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 16px; }
.empty-text { font-size: 15px; color: var(--text-secondary, #64748b); font-weight: 500; display: block; margin-bottom: 24px; }
.btn-clear {
  background: #2563eb; color: #fff; font-size: 14px; font-weight: 600;
  border-radius: var(--radius-sm, 12px); height: 40px; line-height: 40px; border: none; width: 140px;
}
.bottom-safe { height: calc(var(--tab-bar-height, 50px) + 20px); }

/* ---- Dark Mode ---- */
.is-dark { background-color: var(--text-primary, #0f172a); }
.is-dark .search-bar { background: #1e293b; box-shadow: none; }
.is-dark .search-input { color: #f8fafc; }
.is-dark .feature-label { color: #e2e8f0; }
.is-dark .feature-item { background: #1e293b; box-shadow: none; border-color: #334155; }
.is-dark .section-title { color: #f8fafc; }
.is-dark .video-card,
.is-dark .article-card,
.is-dark .consult-card,
.is-dark .path-card { background: #1e293b; box-shadow: none; border-color: #334155; }
.is-dark .checkin-card { border-color: #0e7490; }
.is-dark .checkin-kicker { color: #67e8f9; }
.is-dark .checkin-title { color: #f0f9ff; }
.is-dark .checkin-sub { color: #bae6fd; }
.is-dark .checkin-cta { color: #67e8f9; }
.is-dark .checkin-tip-text { color: var(--text-tertiary, #8e8e93); }
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
.is-dark .path-desc { color: var(--text-tertiary, #8e8e93); }

/* ================================================================
 *  MP-WEIXIN parity overrides — HARDCODED values, no CSS vars.
 *  CSS custom properties set on :root / page may not cascade into
 *  scoped component styles in the mini-program runtime, so we
 *  bypass var() entirely and write concrete values here.
 * ================================================================ */
/* #ifdef MP-WEIXIN */

/* ---- Page background: slightly more contrast vs. white cards ---- */
.home-page {
  background-color: var(--surface-1, #ffffff);
}

.is-dark.home-page {
  background-color: var(--text-primary, #0f172a);
}

/* ---- Icon pills: force GPU compositing to fix blurry border-radius ---- */
.app-icon-tile {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
}

/* ---- Search bar ---- */
.search-bar {
  background: #ffffff;
  border: none;
  box-shadow: 0 2px 8px rgba(15,23,42,0.06);
}

/* ---- Daily check-in card ---- */
.checkin-card {
  overflow: visible;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04);
}
.checkin-kicker { color: rgba(255,255,255,0.8); }
.checkin-title  { color: #ffffff; }
.checkin-sub    { color: rgba(255,255,255,0.9); }
.checkin-cta    { color: #ffffff; }

/* ---- Article / consult / path cards ---- */
.article-card,
.consult-card {
  overflow: visible;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04);
}

.path-card {
  overflow: visible;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04);
}

/* ---- Video cards: overflow:hidden must stay for image clipping,
        so use filter:drop-shadow which renders outside the layer ---- */
.video-card {
  overflow: hidden;
  box-shadow: none;
  filter: none;
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
