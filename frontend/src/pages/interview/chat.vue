<template>
  <view class="chat-container" :class="[themeClass, fontClass]">
    <view class="interview-info" v-if="interview">
      <view class="session-copy">
        <text class="position">{{ interview.positionName }}</text>
        <text class="session-text">{{ t('interviewChat.sessionCopy') }}</text>
      </view>
      <view class="info-actions">
        <text class="difficulty">{{ interview.difficulty }}</text>
        <view class="end-link" @click="endInterview">
          <text class="end-link-text">{{ t('interviewChat.endBtn') }}</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="chat-area" :scroll-top="99999" :scroll-with-animation="true">
      <view class="chat-area-surface">
      <view v-for="(msg, index) in messages" :key="index" :class="['message', msg.role.toLowerCase()]">
        <view class="msg-content">
          <text>{{ msg.content }}</text>
        </view>
      </view>
      <view v-if="aiTyping" class="message ai">
        <view class="msg-content typing">
          <view class="typing-dots">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
          <text v-if="typingElapsed > 2" class="typing-timer">{{ typingElapsed }}s</text>
        </view>
      </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <input 
        class="chat-input" 
        v-model="inputText" 
        :placeholder="t('interviewChat.inputPlaceholder')" 
        placeholder-class="ph"
        @confirm="sendMessage"
      />
      <view 
        class="send-btn" 
        :class="{ 'send-active': inputText.trim() && !aiTyping }"
        @click="sendMessage"
      >
        <text class="send-label">{{ t('interviewChat.sendBtn') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import {
  getInterviewByIdApi,
  getInterviewMessagesApi,
  sendInterviewMessageApi,
  endInterviewApi,
  generateGreetingApi,
} from '@/api/interview';
import type { Interview, InterviewMessage } from '@/api/interview';
import { useTheme } from '@/utils/theme';

const interviewId = ref<number>(0);
const interview = ref<Interview | null>(null);
const messages = ref<InterviewMessage[]>([]);
const inputText = ref('');
const aiTyping = ref(false);
const typingElapsed = ref(0);
let typingTimer: any = null;
const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();

const startTypingTimer = () => {
  typingElapsed.value = 0;
  if (typingTimer) clearInterval(typingTimer);
  typingTimer = setInterval(() => {
    typingElapsed.value += 1;
  }, 1000);
};

const stopTypingTimer = () => {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
  typingElapsed.value = 0;
};
onMounted(async () => {
  refreshTheme();
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  interviewId.value = parseInt(currentPage.options?.interviewId || '0');

  if (interviewId.value) {
    try {
      interview.value = await getInterviewByIdApi(interviewId.value);
      messages.value = await getInterviewMessagesApi(interviewId.value);
      
      // First time entering this session: ask the backend to generate the
      // AI interviewer's opening question. The endpoint is idempotent —
      // if a greeting already exists it just returns it.
      if (messages.value.length === 0) {
        aiTyping.value = true;
        startTypingTimer();
        try {
          const greeting = await generateGreetingApi(interviewId.value);
          if (greeting) messages.value = [greeting];
        } catch (greetErr: any) {
          uni.showToast({ title: greetErr?.message || 'AI service error', icon: 'none', duration: 3000 });
        } finally {
          aiTyping.value = false;
          stopTypingTimer();
        }
      }
    } catch (error: any) {
      console.error('Failed to load interview:', error);
      uni.showToast({ title: error?.message || 'Failed to load interview', icon: 'none' });
    }
  }
});

onShow(() => {
  refreshTheme();
  uni.setNavigationBarTitle({ title: t('interviewChat.navTitle') });
});

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || aiTyping.value) return;

  messages.value.push({ interviewId: interviewId.value, role: 'USER', content: text });
  inputText.value = '';
  aiTyping.value = true;
  startTypingTimer();

  try {
    const response = await sendInterviewMessageApi(interviewId.value, text);
    messages.value.push({ interviewId: interviewId.value, role: 'AI', content: response.aiMessage });
  } catch (error) {
    console.error('Failed to send message:', error);
    uni.showToast({ title: 'Send failed', icon: 'none' });
  } finally {
    aiTyping.value = false;
    stopTypingTimer();
  }
};

const endInterview = () => {
  uni.showModal({
    title: 'End Interview',
    content: 'Are you sure you want to end the interview?',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          // Score is now produced by the AI report endpoint, not the client.
          await endInterviewApi(interviewId.value);
          uni.showToast({ title: 'Interview ended', icon: 'success' });
          // Jump straight to the report screen; it will trigger the AI
          // evaluation on first open and cache it on the interview row.
          setTimeout(() => {
            uni.redirectTo({ url: `/pages/interview/report?interviewId=${interviewId.value}` });
          }, 800);
        } catch (error: any) {
          console.error('Failed to end interview:', error);
          uni.showToast({ title: error?.message || 'Failed to end', icon: 'none' });
        }
      }
    }
  });
};
</script>

<style scoped>
.chat-container {
  height: 100vh;
  background-color: #f5f5f7;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

.interview-info {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px 20px;
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
  gap: 12px;
}

.position { font-size: 16px; font-weight: 700; color: #fff; }

.session-copy {
  flex: 1;
  min-width: 0;
}

.session-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
}

.info-actions {
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}

.difficulty {
  font-size: 12px; color: rgba(255, 255, 255, 0.85);
  background: rgba(255,255,255,0.18);
  padding: 4px 10px; border-radius: 999px;
  font-weight: 600;
}

/* End is intentionally low-emphasis: it lives at the top corner so a thumb
   can't accidentally hit it during fast typing in the bottom half of the screen. */
.end-link {
  min-width: 44px; min-height: 44px;
  padding: 8px 12px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
}
.end-link:active { background: rgba(255,255,255,0.12); }
.end-link-text {
  font-size: 14px; font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.chat-area {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 200px);
  background-color: #f5f5f7;
}

.chat-area-surface {
  min-height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f5f5f7;
}

.message { margin-bottom: 16px; display: flex; }

.message.user { justify-content: flex-end; }

.message.ai { justify-content: flex-start; }

.msg-content {
  max-width: 72%; padding: 12px 16px;
  border-radius: 16px; font-size: 15px; line-height: 1.55;
}

.message.user .msg-content {
  background: #2563eb; color: #fff;
  border-radius: 20px 4px 20px 20px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.message.ai .msg-content {
  background: #fff;
  border: 1px solid var(--border-color);
  color: #1e293b;
  border-radius: 4px 20px 20px 20px;
  box-shadow: var(--shadow-xs);
}

/* Typing dots */
.typing { display: flex; align-items: center; gap: 8px; }
.typing-dots { display: flex; gap: 5px; padding: 4px 6px; align-items: center; }
.typing-timer {
  font-size: 11px;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

.dot {
  width: 6px; height: 6px; border-radius: 3px;
  background: #94a3b8; animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  display: flex; padding: 10px 16px; gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.1);
  align-items: center;
}

.chat-input {
  flex: 1; border: 1.5px solid #e2e8f0; border-radius: 22px;
  padding: 10px 18px; font-size: 15px; background: #f8fafc;
  color: #0f172a; height: 44px;
}

.ph { color: #94a3b8; }

.send-btn {
  min-width: 64px; height: 38px; padding: 0 14px;
  border-radius: 19px;
  background: #e5e5ea; display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.2s;
}

.send-active { background: #2563eb; }

.send-label {
  color: #94a3b8; font-size: 14px; font-weight: 700; letter-spacing: 0.02em;
}
.send-active .send-label { color: #ffffff; }

/* Dark mode */
.is-dark { background-color: #0f172a; }

.is-dark .message.ai .msg-content { background: #1e293b; color: #f8fafc; box-shadow: none; }

.is-dark .input-area { background: rgba(15, 23, 42, 0.92); border-color: #334155; }

.is-dark .chat-input { background: #1e293b; border-color: #334155; color: #f8fafc; }

.is-dark .chat-area,
.is-dark .chat-area-surface {
  background-color: #0f172a;
}

.theme-green .chat-area,
.theme-green .chat-area-surface {
  background-color: #f0fdf4;
}
</style>
