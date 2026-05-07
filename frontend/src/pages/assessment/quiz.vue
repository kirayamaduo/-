<template>
  <view class="quiz-container" :class="[themeClass, fontClass]">
    <view class="header-bar">
      <view class="header-top">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">‹</text>
          <text class="back-text">{{ t('common.back') }}</text>
        </view>
      </view>
      <view class="progress-wrapper">
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: progressPercentage + '%' }"></view>
        </view>
        <text class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</text>
      </view>
    </view>

    <!-- Loading state while we fetch the question bank -->
    <view class="loading-state" v-if="loading">
      <view class="spinner"></view>
      <text class="loading-text">{{ t('quiz.loading') }}</text>
    </view>

    <view class="error-state" v-else-if="errorMsg">
      <text class="err-title">{{ errorMsg }}</text>
      <view class="btn-retry" @click="loadQuestions"><text class="btn-retry-text">{{ t('quiz.retry') }}</text></view>
    </view>

    <template v-else-if="currentQuestion">
      <view class="question-card">
        <text class="q-type">{{ t('quiz.question', { n: currentIndex + 1 }) }}</text>
        <text class="q-title">{{ currentQuestion.questionText }}</text>
      </view>

      <view class="options-list">
        <view
          class="option-item"
          :class="{ 'option-selected': currentAnswerOptionId === opt.optionId }"
          v-for="opt in currentQuestion.options"
          :key="opt.optionId"
          @click="selectOption(opt.optionId)"
        >
          <view class="option-label">{{ opt.optionLabel }}</view>
          <text class="option-text">{{ opt.optionText }}</text>
        </view>
      </view>
    </template>

    <view class="bottom-action" v-if="!loading && !errorMsg">
      <view
        class="btn-prev"
        :class="{ 'btn-disabled': currentIndex === 0 }"
        @click="handlePrev"
      ><text class="btn-prev-text">{{ t('quiz.previous') }}</text></view>
      <view
        class="btn-next"
        :class="{ 'btn-next-disabled': currentAnswerOptionId == null || submitting }"
        @click="handleNext"
      ><text class="btn-next-text">{{ submitting ? t('quiz.submitting') : (isLastQuestion ? t('quiz.viewResults') : t('quiz.next')) }}</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import {
  getScaleQuestionsApi,
  submitAssessmentApi,
  type QuizQuestion,
} from '@/api/assessment';
import { useTheme } from '@/utils/theme';

const currentIndex = ref(0);
const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const loading = ref(true);
const submitting = ref(false);
const errorMsg = ref('');

const scaleId = ref<number>(0);
const scaleTitle = ref('');
const questions = ref<QuizQuestion[]>([]);

// answers maps questionId -> selected optionId. Stable across navigation.
const answers = ref<Record<number, number>>({});

const currentQuestion = computed(() => questions.value[currentIndex.value]);
const currentAnswerOptionId = computed(() => {
  const q = currentQuestion.value;
  return q ? answers.value[q.questionId] : null;
});
const isLastQuestion = computed(() => currentIndex.value === questions.value.length - 1);
const progressPercentage = computed(() =>
  questions.value.length === 0
    ? 0
    : ((currentIndex.value + 1) / questions.value.length) * 100,
);

const loadQuestions = async () => {
  if (!scaleId.value) {
    errorMsg.value = 'Missing scale id';
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const list = await getScaleQuestionsApi(scaleId.value);
    questions.value = list || [];
    if (questions.value.length === 0) {
      errorMsg.value = 'This quiz has no questions yet.';
    }
  } catch (e: any) {
    errorMsg.value = e?.message || 'Failed to load questions';
  } finally {
    loading.value = false;
  }
};

const selectOption = (optionId: number) => {
  const q = currentQuestion.value;
  if (!q) return;
  answers.value[q.questionId] = optionId;
  // Auto-advance feels great on a long quiz, but only when this isn't the
  // last question -- the final tap should require an explicit submit.
  if (!isLastQuestion.value) {
    setTimeout(() => {
      currentIndex.value++;
    }, 250);
  }
};

const handlePrev = () => {
  if (currentIndex.value > 0) currentIndex.value--;
};

const submitQuiz = async () => {
  if (submitting.value) return;
  submitting.value = true;
  uni.showLoading({ title: 'Submitting...' });
  try {
    const record = await submitAssessmentApi(scaleId.value, answers.value);
    uni.hideLoading();
    uni.redirectTo({
      url: `/pages/assessment/result?recordId=${record.recordId}`,
    });
  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: e?.message || 'Submission failed', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

const handleNext = () => {
  if (currentAnswerOptionId.value == null) {
    uni.showToast({ title: 'Please select an option', icon: 'none' });
    return;
  }
  if (isLastQuestion.value) {
    submitQuiz();
  } else {
    currentIndex.value++;
  }
};

const goBack = () => {
  if (Object.keys(answers.value).length > 0) {
    uni.showModal({
      title: 'Exit Quiz?',
      content: 'Your progress will be lost. Are you sure you want to exit?',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) uni.navigateBack({ delta: 1 });
      }
    });
    return;
  }
  uni.navigateBack({ delta: 1 });
};

onMounted(() => {
  refreshTheme();
  // Pull scaleId + title from query params (set by assessment/index.vue).
  const pages = getCurrentPages();
  const opts = (pages[pages.length - 1] as any).options || {};
  scaleId.value = parseInt(opts.scaleId || '0');
  if (opts.title) {
    try { scaleTitle.value = decodeURIComponent(opts.title); } catch { /* keep default */ }
    uni.setNavigationBarTitle({ title: scaleTitle.value });
  }
  loadQuestions();
});

onShow(() => {
  refreshTheme();
  uni.setNavigationBarTitle({ title: scaleTitle.value || t('assessment.pageTitle') });
});
</script>

<style scoped>
.quiz-container {
  min-height: 100vh;
  background-color: #f5f5f7;
  padding: 122px 20px 120px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  box-sizing: border-box;
}

.header-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: rgba(245, 245, 247, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 100;
  padding: calc(var(--status-bar-height, 20px) + 6px) 20px 14px 20px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.1);
}

.header-top { display: flex; align-items: center; margin-bottom: 10px; }

.back-btn { display: inline-flex; align-items: center; gap: 2px; color: #2563eb; }

.back-icon { font-size: 20px; font-weight: 300; line-height: 1; }

.back-text { font-size: 16px; font-weight: 500; }

.progress-wrapper { width: 100%; display: flex; align-items: center; gap: 12px; }

.progress-track { flex: 1; height: 6px; background-color: #e5e5ea; border-radius: 3px; overflow: hidden; }

.progress-fill { height: 100%; background-color: #007aff; border-radius: 3px; transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }

.progress-text { font-size: 13px; font-weight: 500; color: #8e8e93; width: 40px; text-align: right; }

.question-card { margin-bottom: 40px; padding: 0 8px; }

.q-type { font-size: 14px; font-weight: 600; color: #007aff; margin-bottom: 12px; display: block; letter-spacing: 1px; }

.q-title { font-size: 26px; font-weight: 700; color: #000000; line-height: 1.4; letter-spacing: -0.5px; }

.options-list { display: flex; flex-direction: column; gap: 16px; }

.option-item {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}

.option-item:active { transform: scale(0.98); }

.option-selected { background-color: #eff6ff; border-color: #3b82f6; }

.option-label {
  width: 28px; height: 28px; border-radius: 14px;
  background-color: #f2f2f7; color: #636366;
  font-size: 14px; font-weight: 600;
  display: flex; justify-content: center; align-items: center;
  margin-right: 16px; flex-shrink: 0;
}

.option-selected .option-label { background-color: #3b82f6; color: #ffffff; }

.option-text { font-size: 17px; color: #1c1c1e; line-height: 1.5; flex: 1; }

.option-selected .option-text { color: #1e3a8a; font-weight: 500; }

.bottom-action {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 16px 20px 32px 20px;
  background: rgba(245, 245, 247, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.1);
  z-index: 100;
  display: flex; gap: 16px;
}

/* Custom-rendered buttons (using <view>) so mp-weixin's native <button>
   default styles can't override our colours. */
.btn-prev {
  flex: 1; background-color: #ffffff;
  border-radius: 16px;
  height: 52px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-color);
}
.btn-prev-text {
  color: #2563eb; font-size: 17px; font-weight: 600;
}
.btn-disabled .btn-prev-text { color: #c7c7cc; }
.btn-disabled { background-color: #f2f2f7; border-color: transparent; }

.btn-next {
  flex: 2; background-color: #2563eb;
  border-radius: 16px;
  height: 52px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.32);
  transition: background 0.15s, opacity 0.15s;
}
.btn-next-text {
  color: #ffffff; font-size: 17px; font-weight: 700;
}
.btn-next:active { background-color: #1d4ed8; }
.btn-next-disabled { background-color: #cbd5e1; box-shadow: none; }
.btn-next-disabled .btn-next-text { color: #ffffff; opacity: 0.85; }

/* Loading + error states */
.loading-state, .error-state {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 60px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  margin-top: 24px;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0; border-top-color: #2563eb;
  border-radius: 50%;
  animation: quiz-spin 0.9s linear infinite;
}
@keyframes quiz-spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 14px; color: #475569; }
.err-title { font-size: 15px; color: #b91c1c; font-weight: 600; }
.btn-retry {
  background: #2563eb; height: 40px; padding: 0 24px;
  border-radius: 12px; display: flex; align-items: center;
}
.btn-retry-text { color: #fff; font-size: 14px; font-weight: 600; }

.is-dark { background-color: #0f172a; }

.is-dark .header-bar,
.is-dark .option-item,
.is-dark .bottom-action { background: #1e293b; border-color: #334155; }

.is-dark .q-title,
.is-dark .option-text,
.is-dark .progress-text,
.is-dark .back-text { color: #f8fafc; }

.is-dark .option-label,
.is-dark .progress-track { background-color: #334155; color: #94a3b8; }
</style>