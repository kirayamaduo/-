<template>
  <SlPage class="app-soft-bg" :custom-class="[themeClass, fontClass].join(' ')">
    <SlNavBar :title="t('assistantHistory.navTitle')" show-back @back="goBack" :safe-top="topSafe" />

    <scroll-view class="content" scroll-y>
      <view class="retention-card app-card-soft app-surface">
        <text class="retention-title">{{ t('assistantHistory.retentionTitle') }}</text>
        <text class="retention-desc">{{ t('assistantHistory.retentionDesc') }}</text>
        <text class="retention-desc">{{ t('assistantHistory.retentionDesc2') }}</text>
      </view>

      <view v-if="loading" class="loading-card app-card-soft app-surface">
        <text class="loading-text">{{ t('assistantHistory.loading') }}</text>
      </view>

      <view v-else-if="sessions.length === 0" class="empty-state app-empty app-surface">
        <text class="empty-icon ri-chat-3-line"></text>
        <text class="empty-title">{{ t('assistantHistory.emptyTitle') }}</text>
        <text class="empty-desc">{{ t('assistantHistory.emptyDesc') }}</text>
      </view>

      <view v-else class="session-list">
        <view
          v-for="session in sessions"
          :key="session.sessionId"
          class="session-card app-card-soft app-surface"
          @click="openSession(session)"
        >
          <view class="session-top">
            <view class="persona-pill">
              <text class="persona-emoji" :class="personaMeta(session.persona).emoji"></text>
              <text class="persona-name">{{ personaMeta(session.persona).label }}</text>
            </view>
            <text class="session-time">{{ formatTime(session.updatedAt || session.createdAt) }}</text>
          </view>
          <text class="session-title">{{ session.title || t('assistantHistory.newConversation') }}</text>
          <view class="session-bottom">
            <text class="session-hint">{{ t('assistantHistory.tapToContinue') }}</text>
            <view class="delete-btn" @click.stop="confirmDelete(session)">
              <text class="delete-text">{{ t('assistantHistory.deleteBtn') }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-safe"></view>
    </scroll-view>
  </SlPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { getMpSafeAreaMetrics } from '@/utils/safeArea';
import request from '@/utils/request';
import { useTheme } from '@/utils/theme';
import SlPage from '@/style-library/components/SlPage.vue';
import SlNavBar from '@/style-library/components/SlNavBar.vue';

interface AssistantSession {
  sessionId: number;
  userId: number;
  title?: string;
  persona?: 'MENTOR' | 'CHALLENGER' | 'INTERVIEWER' | string;
  createdAt?: string;
  updatedAt?: string;
}

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const topSafe = ref(44);
const loading = ref(true);
const sessions = ref<AssistantSession[]>([]);

const personaMeta = (persona?: string) => {
  const map: Record<string, { emoji: string; label: string }> = {
    MENTOR: { emoji: 'ri-compass-3-line', label: '小职' },
    CHALLENGER: { emoji: 'ri-shield-star-line', label: '小严' },
    INTERVIEWER: { emoji: 'ri-mic-line', label: '小面' },
  };
  return map[persona || 'MENTOR'] || map.MENTOR;
};

const loadSessions = async () => {
  loading.value = true;
  try {
    const userId = Number(uni.getStorageSync('userId'));
    if (!userId) {
      sessions.value = [];
      return;
    }
    const res = await request<AssistantSession[]>({ url: `/api/chat/history/${userId}`, method: 'GET' });
    sessions.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || 'Failed to load history', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return t('messages.timeToday', { time }) || `Today ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
};

const openSession = (session: AssistantSession) => {
  uni.setStorageSync('assistantOpenSession', {
    sessionId: session.sessionId,
    persona: session.persona || 'MENTOR',
  });
  uni.switchTab({ url: '/pages/assistant/index' });
};

const confirmDelete = (session: AssistantSession) => {
  uni.showModal({
    title: t('assistantHistory.deleteBtn'),
    content: t('assistantHistory.deleteConfirm', { title: session.title || t('assistantHistory.newConversation') }),
    confirmText: t('assistantHistory.deleteBtn'),
    confirmColor: '#ef4444',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await request({ url: `/api/chat/history/session/${session.sessionId}`, method: 'DELETE' });
        sessions.value = sessions.value.filter((s) => s.sessionId !== session.sessionId);
        uni.showToast({ title: t('assistantHistory.deleteSuccess'), icon: 'success' });
      } catch (e: any) {
        uni.showToast({ title: e?.message || t('assistantHistory.deleteFailed'), icon: 'none' });
      }
    },
  });
};

const goBack = () => uni.navigateBack();

onMounted(() => {
  refreshTheme();
  topSafe.value = getMpSafeAreaMetrics().topSafeHeight;
  loadSessions();
});
</script>

<style scoped>
.sl-page :deep(.history-page) {
  min-height: 100vh;
}
.content { height: calc(100vh - 96px); padding: 16px; box-sizing: border-box; }
.retention-card, .loading-card, .session-card { border-radius: var(--radius-lg, 18px); }
.retention-card { padding: 16px; margin-bottom: 14px; }
.retention-title { display: block; font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a); margin-bottom: 8px; }
.retention-desc { display: block; font-size: 13px; line-height: 1.55; color: var(--text-secondary, #64748b); margin-top: 6px; }
.loading-card { padding: 18px; text-align: center; }
.loading-text { font-size: 13px; color: var(--text-secondary, #64748b); }
.empty-state { padding: 56px 18px; text-align: center; }
.empty-icon { display: block; font-size: 48px; margin-bottom: 10px; }
.empty-title { display: block; font-size: 17px; font-weight: 800; color: var(--text-primary, #0f172a); margin-bottom: 8px; }
.empty-desc { display: block; font-size: 13px; line-height: 1.55; color: var(--text-secondary, #64748b); }
.session-list { display: flex; flex-direction: column; gap: 12px; }
.session-card { padding: 14px; }
.session-card:active { transform: scale(0.99); background: var(--surface-2, #f8fafc); }
.session-top, .session-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.persona-pill { display: flex; align-items: center; gap: 5px; background: var(--primary-soft, #eff6ff); border-radius: 999px; padding: 5px 9px; }
.persona-emoji { font-size: 14px; }
.persona-name { font-size: 12px; font-weight: 800; color: var(--primary-color, #2563eb); }
.session-time { font-size: 12px; color: var(--text-tertiary, #8e8e93); }
.session-title { display: block; font-size: 15px; font-weight: 800; line-height: 1.45; color: var(--text-primary, #0f172a); margin: 12px 0; }
.session-hint { font-size: 12px; color: var(--text-secondary, #64748b); }
.delete-btn { border: 1px solid #fecaca; border-radius: 999px; padding: 5px 10px; }
.delete-text { font-size: 12px; font-weight: 700; color: var(--danger-color, #ef4444); }
.bottom-safe { height: 48px; }
.is-dark .retention-title, .is-dark .session-title, .is-dark .empty-title { color: #f8fafc; }
.is-dark .retention-card, .is-dark .loading-card, .is-dark .session-card { background: #1e293b; border-color: #334155; box-shadow: none; }
.is-dark .retention-desc, .is-dark .loading-text, .is-dark .empty-desc, .is-dark .session-hint, .is-dark .session-time { color: var(--text-tertiary, #8e8e93); }
.is-dark .persona-pill { background: rgba(37,99,235,0.16); }
.is-dark .session-card:active { background: #334155; }
</style>
