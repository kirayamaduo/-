<template>
  <view class="chat-page" :class="[themeClass, fontClass]">
    <!-- Custom nav bar -->
    <view class="chat-nav">
      <view class="nav-spacer" :style="{ height: topSafeHeight + 'px' }"></view>
      <view class="nav-row">
        <view class="nav-bot-avatar" :style="{ background: currentPersona.gradient }">
          <text class="nav-bot-emoji">{{ currentPersona.emoji }}</text>
        </view>
        <view class="nav-meta">
          <text class="nav-name">{{ currentPersona.name }}</text>
          <view class="nav-status-row">
            <view class="online-dot"></view>
            <text class="nav-status">{{ currentPersona.tagline }}</text>
          </view>
        </view>
        <view class="nav-action" @click="openHistory">
          <text class="nav-action-text">{{ t('assistantPage.history') }}</text>
        </view>
      </view>
      <!-- F15: Persona switcher -->
      <view class="persona-bar">
        <view
          v-for="p in PERSONAS"
          :key="p.key"
          class="persona-chip"
          :class="{ 'persona-active': persona === p.key }"
          @click="switchPersona(p.key)"
        >
          <text class="persona-emoji">{{ p.emoji }}</text>
          <text class="persona-label">{{ p.label }}</text>
        </view>
      </view>
    </view>

    <!-- Chat messages area -->
    <scroll-view
      class="chat-list"
      scroll-y
      :scroll-top="scrollTop"
      scroll-with-animation
    >
      <!-- Full-bleed surface so MP scroll-view never shows a light strip
           below long threads (scroll-view default vs page theme). -->
      <view class="chat-list-surface">
      <!-- Welcome card -->
      <view class="welcome-card">
        <view class="welcome-icon">{{ currentPersona.emoji }}</view>
        <text class="welcome-title">{{ currentPersona.name }}</text>
        <text class="welcome-desc">{{ currentPersona.intro }}</text>
        <view class="agent-scope">
          <text class="agent-scope-label">{{ t('assistantPage.bestFor') }}</text>
          <text class="agent-scope-text">{{ currentPersona.bestFor }}</text>
        </view>
        <view class="agent-note">
          <text class="agent-note-text">{{ currentPersona.note }}</text>
        </view>
        <view class="quick-actions">
          <view
            v-for="chip in currentPersona.chips"
            :key="chip"
            class="quick-chip"
            @click="sendQuick(chip)"
          >
            <text class="chip-text">{{ chip }}</text>
          </view>
        </view>
      </view>

      <!-- Timestamp -->
      <view class="time-divider">
        <text class="time-text">{{ chatTimeLabel }}</text>
      </view>

      <!-- Messages -->
      <view
        class="msg-row"
        v-for="(msg, index) in messages"
        :key="index"
        :class="msg.role === 'user' ? 'row-user' : 'row-ai'"
      >
        <!-- AI avatar (top-left of bubble) -->
        <view class="bot-avatar" v-if="msg.role === 'ai'">
          <text class="bot-emoji">🤖</text>
        </view>

        <view class="bubble-area">
          <view class="bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'">
            <view class="typing-dots" v-if="msg.isTyping">
              <view class="dot"></view>
              <view class="dot"></view>
              <view class="dot"></view>
            </view>
            <text class="bubble-text" v-else>{{ msg.content }}</text>
          </view>
        </view>
      </view>

      <view class="scroll-pad"></view>
      </view>
    </scroll-view>

    <!-- Input area -->
    <view class="input-bar">
      <view class="input-row">
        <input
          class="chat-input"
          v-model="inputText"
          :placeholder="t('assistantPage.inputHint')"
          placeholder-class="input-ph"
          @confirm="sendMessage"
          confirm-type="send"
        />
        <view
          class="send-btn"
          :class="{ 'send-active': inputText.trim().length > 0 }"
          @click="sendMessage"
        >
          <text class="send-label">{{ t('assistant.send') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getTopSafeHeight } from '@/utils/safeArea';
import request from '@/utils/request';
import { useTheme } from '@/utils/theme';
import { useI18n } from '@/locales';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  isTyping?: boolean;
}

interface AssistantMessage {
  msgId: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

type PersonaKey = 'MENTOR' | 'CHALLENGER' | 'INTERVIEWER';

// F15: persona definitions — 所有文案通过 t() 读取，随语言切换自动变化
const PERSONAS: { key: PersonaKey; emoji: string; label: string; name: string; tagline: string; intro: string; bestFor: string; note: string; gradient: string; chips: string[] }[] = [
  {
    key: 'MENTOR',
    emoji: '🧭',
    label: '小职',
    name: t('assistantPage.personas.MENTOR.name'),
    tagline: t('assistantPage.personas.MENTOR.tagline'),
    intro: t('assistantPage.personas.MENTOR.intro'),
    bestFor: t('assistantPage.personas.MENTOR.bestFor'),
    note: t('assistantPage.personas.MENTOR.note'),
    gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    chips: [
      t('assistantPage.personas.MENTOR.chip1'),
      t('assistantPage.personas.MENTOR.chip2'),
      t('assistantPage.personas.MENTOR.chip3'),
    ],
  },
  {
    key: 'CHALLENGER',
    emoji: '💪',
    label: '小严',
    name: t('assistantPage.personas.CHALLENGER.name'),
    tagline: t('assistantPage.personas.CHALLENGER.tagline'),
    intro: t('assistantPage.personas.CHALLENGER.intro'),
    bestFor: t('assistantPage.personas.CHALLENGER.bestFor'),
    note: t('assistantPage.personas.CHALLENGER.note'),
    gradient: 'linear-gradient(135deg, #dc2626, #f97316)',
    chips: [
      t('assistantPage.personas.CHALLENGER.chip1'),
      t('assistantPage.personas.CHALLENGER.chip2'),
      t('assistantPage.personas.CHALLENGER.chip3'),
    ],
  },
  {
    key: 'INTERVIEWER',
    emoji: '🎙️',
    label: '小面',
    name: t('assistantPage.personas.INTERVIEWER.name'),
    tagline: t('assistantPage.personas.INTERVIEWER.tagline'),
    intro: t('assistantPage.personas.INTERVIEWER.intro'),
    bestFor: t('assistantPage.personas.INTERVIEWER.bestFor'),
    note: t('assistantPage.personas.INTERVIEWER.note'),
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    chips: [
      t('assistantPage.personas.INTERVIEWER.chip1'),
      t('assistantPage.personas.INTERVIEWER.chip2'),
      t('assistantPage.personas.INTERVIEWER.chip3'),
    ],
  },
];

const persona = ref<PersonaKey>('MENTOR');
const currentPersona = computed(() => PERSONAS.find((p) => p.key === persona.value)!);

const messages = ref<ChatMessage[]>([]);
const apiHistory = ref<{ role: string; content: string }[]>([]);

const inputText = ref('');
const scrollTop = ref(0);
const topSafeHeight = ref(88);
const isSending = ref(false);
const chatTimeLabel = ref('');
const sessionId = ref<number | null>(null);

const openHistory = () => {
  uni.navigateTo({ url: '/pages/assistant/history' });
};

const isPersonaKey = (value: string): value is PersonaKey =>
  value === 'MENTOR' || value === 'CHALLENGER' || value === 'INTERVIEWER';

const loadSessionMessages = async (sid: number, selectedPersona?: string) => {
  const nextPersona = selectedPersona && isPersonaKey(selectedPersona) ? selectedPersona : persona.value;
  persona.value = nextPersona;
  sessionId.value = sid;
  try {
    const res = await request<AssistantMessage[]>({
      url: `/api/chat/history/session/${sid}`,
      method: 'GET',
    });
    const rows = Array.isArray(res) ? res.filter((m) => m.role !== 'system') : [];
    messages.value = rows.length > 0
      ? rows.map((m) => ({ role: m.role === 'user' ? 'user' : 'ai', content: m.content }))
      : [{ role: 'ai', content: currentPersona.value.intro }];
    apiHistory.value = rows.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
    scrollToBottom();
  } catch (e: any) {
    uni.showToast({ title: e?.message || t('assistantPage.openHistoryFailed'), icon: 'none' });
  }
};

const openPendingSessionIfAny = () => {
  const pending = uni.getStorageSync('assistantOpenSession');
  if (!pending?.sessionId) return;
  uni.removeStorageSync('assistantOpenSession');
  loadSessionMessages(Number(pending.sessionId), pending.persona);
};

const switchPersona = (key: PersonaKey) => {
  if (persona.value === key) return;
  persona.value = key;
  sessionId.value = null;
  // Clear history for fresh start with new persona
  apiHistory.value = [];
  messages.value = [
    { role: 'ai', content: currentPersona.value.intro },
  ];
};

const scrollToBottom = () => {
  nextTick(() => {
    scrollTop.value = scrollTop.value === 99998 ? 99999 : 99998;
  });
};

const sendQuick = (text: string) => {
  inputText.value = text;
  sendMessage();
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || isSending.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  isSending.value = true;
  scrollToBottom();

  const typingIdx = messages.value.length;
  messages.value.push({ role: 'ai', content: '', isTyping: true });
  scrollToBottom();

  try {
    const sid = await ensureSession();
    const res = await request<{ reply: string }>({
      url: '/api/chat/send',
      method: 'POST',
      data: {
        message: text,
        history: apiHistory.value,
        persona: persona.value,
        sessionId: sid,
      },
    });
    const reply = (res as any)?.reply ?? res ?? '';
    messages.value[typingIdx] = { role: 'ai', content: reply || t('assistantPage.noResponse') };
    apiHistory.value.push(
      { role: 'user', content: text },
      { role: 'assistant', content: String(reply) },
    );
    if (sid) {
      await appendMessage(sid, text, String(reply || ''));
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err) || 'Unknown error';
    messages.value[typingIdx] = {
      role: 'ai',
      content: t('assistantPage.requestFailed', { msg: errMsg }),
    };
  } finally {
    isSending.value = false;
    scrollToBottom();
  }
};

const ensureSession = async () => {
  if (sessionId.value) return sessionId.value;
  try {
    const session = await request<{ sessionId: number }>({
      url: '/api/chat/history/create',
      method: 'POST',
      data: { title: 'New Conversation', persona: persona.value },
    });
    sessionId.value = session.sessionId;
    return sessionId.value;
  } catch {
    return null;
  }
};

const appendMessage = async (sid: number, userMessage: string, assistantReply: string) => {
  try {
    await request({
      url: `/api/chat/history/session/${sid}/append`,
      method: 'POST',
      data: { userMessage, assistantReply, persona: persona.value },
    });
  } catch { }
};

onMounted(() => {
  refreshTheme();
  topSafeHeight.value = getTopSafeHeight();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  chatTimeLabel.value = t('messages.timeToday', { time: timeStr });
  // Initialise with persona greeting
  messages.value = [{ role: 'ai', content: currentPersona.value.intro }];
  openPendingSessionIfAny();
});

onShow(() => {
  refreshTheme();
  openPendingSessionIfAny();
});
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--page-ios-gray);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

/* ---- Nav bar ---- */
.chat-nav {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  flex-shrink: 0;
  z-index: 10;
}

.nav-spacer {
  width: 100%;
}

.nav-row {
  display: flex;
  align-items: center;
  padding: 10px 20px 12px;
}

.nav-bot-avatar {
  width: 38px;
  height: 38px;
  border-radius: 19px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.nav-bot-emoji {
  font-size: 20px;
}

.nav-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.nav-name {
  font-size: var(--font-section);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.nav-status-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #22c55e;
}

.nav-status {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.35;
}

.nav-action {
  flex-shrink: 0;
  background: #eff6ff;
  border-radius: 999px;
  padding: 7px 12px;
}

.nav-action:active {
  background: #dbeafe;
}

.nav-action-text {
  font-size: 12px;
  font-weight: 800;
  color: #2563eb;
}

/* ---- Persona bar ---- */
.persona-bar {
  display: flex;
  padding: 8px 16px 12px;
  gap: 8px;
}
.persona-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(60, 60, 67, 0.12);
  border-radius: 20px;
  transition: all 0.2s;
}
.persona-chip:active { opacity: 0.75; }
.persona-active {
  background: #eff6ff;
  border-color: #2563eb;
}
.persona-emoji { font-size: 14px; }
.persona-label { font-size: 13px; font-weight: 600; color: #374151; }
.persona-active .persona-label { color: #2563eb; }

/* ---- Chat list ---- */
.chat-list {
  flex: 1;
  min-height: 0;
  height: 0;
  box-sizing: border-box;
}

.chat-list-surface {
  min-height: 100%;
  padding: 16px 16px 0;
  box-sizing: border-box;
  background-color: #f5f5f7;
}

.scroll-pad {
  height: 140px;
}

/* ---- Welcome card ---- */
.welcome-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border-strong);
  box-shadow: 0 5px 16px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.welcome-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.welcome-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.welcome-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
  margin-bottom: 14px;
}

.agent-scope {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 12px;
  box-sizing: border-box;
  margin-bottom: 10px;
  text-align: left;
}

.agent-scope-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.agent-scope-text {
  display: block;
  font-size: 12px;
  line-height: 1.45;
  color: #334155;
}

.agent-note {
  width: 100%;
  background: #eff6ff;
  border-radius: 12px;
  padding: 9px 12px;
  box-sizing: border-box;
  margin-bottom: 18px;
  text-align: left;
}

.agent-note-text {
  font-size: 12px;
  line-height: 1.45;
  color: #1d4ed8;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.quick-chip {
  background: #eff6ff;
  border-radius: 20px;
  padding: 8px 16px;
  transition: all 0.15s;
}

.quick-chip:active {
  background: #dbeafe;
  transform: scale(0.96);
}

.chip-text {
  font-size: 13px;
  font-weight: 500;
  color: #2563eb;
}

/* ---- Time divider ---- */
.time-divider {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.time-text {
  font-size: 11px;
  color: #8e8e93;
  background: rgba(142, 142, 147, 0.12);
  padding: 3px 12px;
  border-radius: 10px;
}

/* ---- Messages ---- */
.msg-row {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.row-user {
  flex-direction: row-reverse;
}

.bot-avatar {
  width: 34px;
  height: 34px;
  border-radius: 17px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  margin-top: 2px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.bot-emoji {
  font-size: 18px;
}

.bubble-area {
  max-width: 72%;
}

.bubble {
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.55;
  overflow-wrap: break-word;
  word-break: normal;
}

.bubble-ai {
  background: #ffffff;
  color: #1c1c1e;
  border-radius: 4px 20px 20px 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
}

.bubble-user {
  background: #2563eb;
  color: #ffffff;
  border-radius: 20px 4px 20px 20px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.bubble-text {
  display: block;
}

/* ---- Typing dots ---- */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #8e8e93;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ---- Input bar ---- */
.input-bar {
  background: rgba(245, 245, 247, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.1);
  /* In mp-weixin the system tab bar is rendered OUTSIDE the page viewport,
     so 100vh / bottom:0 already sits flush with the tab bar's top edge.
     Adding `--tab-bar-height` here was double-counting and left a fat gap. */
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  box-sizing: border-box;
}

.input-row {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  border: 1px solid var(--border-strong);
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
}

.chat-input {
  flex: 1;
  height: 40px;
  font-size: 15px;
  color: #000000;
}

.input-ph {
  color: #8e8e93;
  font-size: 15px;
}

.send-btn {
  min-width: 64px;
  height: 36px;
  padding: 0 14px;
  border-radius: 18px;
  background: #e5e5ea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.send-active {
  background: #2563eb;
}

.send-label {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.send-active .send-label {
  color: #ffffff;
}

/* ---- Dark mode ---- */
.is-dark {
  background: #0f172a;
}

.is-dark .chat-nav {
  background: rgba(15, 23, 42, 0.88);
  border-color: #334155;
}

.is-dark .nav-name,
.is-dark .welcome-title {
  color: #f8fafc;
}

.is-dark .welcome-desc,
.is-dark .nav-status,
.is-dark .agent-scope-text {
  color: #94a3b8;
}

.is-dark .agent-scope {
  background: #0f172a;
  border-color: #334155;
}

.is-dark .agent-note {
  background: rgba(37, 99, 235, 0.14);
}

.is-dark .agent-note-text {
  color: #93c5fd;
}

.is-dark .welcome-card,
.is-dark .bubble-ai,
.is-dark .bot-avatar {
  background: #1e293b;
  box-shadow: none;
}

.is-dark .bubble-ai {
  color: #f8fafc;
}

.is-dark .input-bar {
  background: rgba(15, 23, 42, 0.92);
  border-color: #334155;
}

.is-dark .input-row {
  background: #1e293b;
  border-color: #334155;
}

.is-dark .chat-input {
  color: #f8fafc;
}

.is-dark .quick-chip { background: rgba(37, 99, 235, 0.15); }
.is-dark .quick-chip:active { background: rgba(37, 99, 235, 0.25); }
.is-dark .chip-text { color: #60a5fa; }
.is-dark .nav-action { background: rgba(37, 99, 235, 0.16); }
.is-dark .nav-action:active { background: rgba(37, 99, 235, 0.26); }
.is-dark .persona-chip { background: rgba(30, 41, 59, 0.6); border-color: #334155; }
.is-dark .persona-active { background: rgba(37, 99, 235, 0.2); border-color: #2563eb; }
.is-dark .persona-label { color: #94a3b8; }
.is-dark .persona-active .persona-label { color: #60a5fa; }
.is-dark .time-text { color: #94a3b8; background: rgba(100, 116, 139, 0.15); }
.is-dark .send-btn { background: #334155; }
.is-dark .send-label { color: #64748b; }
.is-dark .send-active .send-label { color: #ffffff; }
.is-dark .dot { background: #64748b; }

.is-dark .chat-list-surface {
  background-color: #0f172a;
}

.theme-green .chat-list-surface {
  background-color: #f0fdf4;
}

/* ================================================================
 *  MP-WEIXIN parity overrides (scoped to assistant/chat page)
 * ================================================================ */
/* #ifdef MP-WEIXIN */

/* backdrop-filter unsupported — use solid background for input bar */
.input-bar {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: #f5f5f7;
}

/* Stronger border on the pill-shaped input row */
.input-row {
  border: 1.5px solid #b8c8d8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}

/* Chat nav: solid white instead of frosted */
.chat-nav {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: #ffffff;
  border-bottom: 1px solid #d0dae4;
}

/* Welcome card: content card gets depth */
.welcome-card {
  overflow: visible;
  border: 1px solid #b8c8d8;
  box-shadow: 0 4px 14px rgba(0,0,0,0.14);
}

.is-dark .chat-nav,
.is-dark .input-bar {
  background: #0f172a;
  border-color: #334155;
}

.is-dark .welcome-card,
.is-dark .bubble-ai,
.is-dark .bot-avatar,
.is-dark .input-row {
  background: #1e293b;
  border-color: #334155;
}

.is-dark .persona-chip {
  background: #1e293b;
  border-color: #334155;
}

.is-dark .persona-label {
  color: #cbd5e1;
}

.chat-page.is-dark .input-bar {
  background: rgba(15, 23, 42, 0.96);
  border-color: #334155;
}

.chat-page.is-dark .chat-nav {
  background: #0f172a;
  border-bottom-color: #334155;
}

.chat-page.is-dark .input-row {
  background: #1e293b;
  border-color: #334155;
  box-shadow: none;
}

.chat-list {
  background-color: #f5f5f7;
}

.chat-page.is-dark .chat-list,
.chat-page.is-dark .chat-list-surface {
  background-color: #0f172a;
}

.chat-page.theme-green .chat-list,
.chat-page.theme-green .chat-list-surface {
  background-color: #f0fdf4;
}

/* #endif */
</style>
