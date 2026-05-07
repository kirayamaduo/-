<template>
  <view class="result-container" :class="[themeClass, fontClass]">
    <!-- Loading + error states -->
    <view class="loading-state" v-if="loading">
      <view class="spinner"></view>
      <text class="loading-text">{{ t('assessmentResult.loading') }}</text>
    </view>

    <view class="error-state" v-else-if="errorMsg">
      <text class="err-title">{{ errorMsg }}</text>
      <view class="btn-retry" @click="loadResult"><text class="btn-retry-text">{{ t('assessmentResult.retry') }}</text></view>
    </view>

    <template v-else-if="record">
      <view class="result-header">
        <text class="result-subtitle">{{ t('assessmentResult.personalityType') }}</text>
        <text class="result-title">{{ summaryDisplay }}</text>
        <view class="tags-container" v-if="typeTags.length > 0">
          <text class="tag" v-for="(t, i) in typeTags" :key="i">{{ t }}</text>
        </view>
      </view>

      <view class="section-title">{{ t('assessmentResult.dimensionBreakdown') }}</view>
      <view class="radar-card">
        <view class="skill-bars">
          <view class="skill-row" v-for="(d, i) in dimensions" :key="i">
            <text class="skill-name">{{ d.name }}</text>
            <view class="bar-bg"><view class="bar-fill" :class="d.fillClass" :style="{ width: d.percent + '%' }"></view></view>
            <text class="skill-score">{{ d.value }}</text>
          </view>
        </view>
      </view>

      <view class="section-title">
        <text class="section-title-text">{{ t('assessmentResult.personalityInsight') }}</text>
        <text class="ai-badge" v-if="insight.fromAi">AI</text>
      </view>
      <view class="analysis-card">
        <view class="paragraph">
          <text class="p-title">{{ t('assessmentResult.careerStrengths') }}</text>
          <text class="p-content">{{ insight.strengths }}</text>
        </view>
        <view class="divider"></view>
        <view class="paragraph">
          <text class="p-title">{{ t('assessmentResult.growthAreas') }}</text>
          <text class="p-content">{{ insight.growth }}</text>
        </view>
        <template v-if="insight.suggestedRoles && insight.suggestedRoles.length > 0">
          <view class="divider"></view>
          <view class="paragraph">
            <text class="p-title">{{ t('assessmentResult.suggestedRoles') }}</text>
            <view class="roles-row">
              <text class="role-chip" v-for="(r, i) in insight.suggestedRoles" :key="i">{{ r }}</text>
            </view>
          </view>
        </template>
      </view>
    </template>

    <view class="bottom-action" v-if="!loading && !errorMsg">
      <view
        v-if="primarySuggestedRole"
        class="btn-primary practice-cta"
        @click="practiceInterview"
      >
        <text class="btn-primary-text">{{ t('assessmentResult.practiceInterview', { role: primarySuggestedRole }) }}</text>
      </view>
      <view class="btn-primary" :class="{ 'btn-secondary-tone': !!primarySuggestedRole }" @click="goMap">
        <text class="btn-primary-text">{{ t('assessmentResult.viewCareerMap') }}</text>
      </view>
      <view class="btn-secondary" @click="goBack"><text class="btn-secondary-text">{{ t('assessmentResult.backToAssessment') }}</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { onShow } from '@dcloudio/uni-app';
import {
  getAssessmentRecordApi,
  type AssessmentRecord,
} from '@/api/assessment';
import { updatePreferencesApi } from '@/api/user';
import { useTheme } from '@/utils/theme';

const { t } = useI18n();
const { themeClass, fontClass, refresh: refreshTheme } = useTheme();
const loading = ref(true);
const errorMsg = ref('');
const recordId = ref<number>(0);
const record = ref<AssessmentRecord | null>(null);

/**
 * Static MBTI archetype labels and a short one-liner description per type.
 * The backend already produces the 4-letter code in `result_summary`; we
 * use it here as the lookup key for richer copy. Holland support can be
 * added by branching on `record.scaleId` once Holland questions are seeded.
 */
const MBTI_TYPES: Record<string, { name: string; tags: string[]; strengths: string; growth: string }> = {
  INTJ: { name: 'Architect',     tags: ['Strategic', 'Independent', 'Analytical'],
    strengths: 'You excel at long-range planning and spotting structural weaknesses in complex systems. Your independence and intellectual rigour make you a natural fit for systems architecture, data science and product strategy roles.',
    growth:    'A relentless drive for precision can read as cold to teammates. Make a habit of voicing the human reasoning behind your decisions \u2014 not just the logic.' },
  INTP: { name: 'Logician',      tags: ['Curious', 'Theoretical', 'Calm'],
    strengths: 'You are at your best when you have space to investigate ideas at depth. Research, debugging, algorithm design and tooling are sweet spots.',
    growth:    'Beware analysis paralysis. Set explicit "good-enough" milestones so curiosity doesn\'t stall delivery.' },
  ENTJ: { name: 'Commander',     tags: ['Decisive', 'Driven', 'Organised'],
    strengths: 'You move teams forward with clear vision and confident execution. Engineering management, founding roles, and consulting fit your style.',
    growth:    'Slow down to listen. Your speed can steamroll quieter contributors with valuable insights.' },
  ENTP: { name: 'Debater',       tags: ['Inventive', 'Energetic', 'Bold'],
    strengths: 'You generate options others miss and adapt fast under pressure. Product, growth, and early-stage startup roles play to this.',
    growth:    'Discipline the follow-through. Brilliance without finish is unread documentation.' },
  INFJ: { name: 'Advocate',      tags: ['Insightful', 'Principled', 'Quiet leader'],
    strengths: 'You read people accurately and craft work that aligns with deep values. UX research, design leadership, and HR/L&D suit you.',
    growth:    'Protect your energy. The quiet empathy that helps you understand others can leave you depleted; schedule recovery time.' },
  INFP: { name: 'Mediator',      tags: ['Idealistic', 'Creative', 'Empathetic'],
    strengths: 'Your work shines when it carries personal meaning. Writing, design, and mission-driven product roles let you do your best work.',
    growth:    'Translate values into measurable goals so collaborators understand what "done" looks like.' },
  ENFJ: { name: 'Protagonist',   tags: ['Charismatic', 'Mentoring', 'Warm'],
    strengths: 'You excel at lifting teams and turning vision into shared belief. Engineering management, education, and partnerships are natural fits.',
    growth:    'Don\'t carry every emotional load. Set boundaries so empathy stays a strength, not an exhaustion.' },
  ENFP: { name: 'Campaigner',    tags: ['Enthusiastic', 'Imaginative', 'Sociable'],
    strengths: 'You thrive in roles that mix ideas and people: developer relations, product marketing, design.',
    growth:    'Build small systems for follow-through. Your spark needs scaffolding, not more brainstorming.' },
  ISTJ: { name: 'Logistician',   tags: ['Reliable', 'Detail-oriented', 'Methodical'],
    strengths: 'You build dependable systems and keep them running. Backend, security, ops, and QA roles benefit from your discipline.',
    growth:    'Stay open when better practices emerge. "We\'ve always done it this way" can hide outdated assumptions.' },
  ISFJ: { name: 'Defender',      tags: ['Caring', 'Loyal', 'Practical'],
    strengths: 'You quietly hold teams together with thorough preparation and genuine care. Customer support, internal tooling, and team leadership all suit you.',
    growth:    'Speak up earlier. Your contributions are easy to overlook because you make them look effortless.' },
  ESTJ: { name: 'Executive',     tags: ['Organised', 'Direct', 'Results-driven'],
    strengths: 'You drive operational excellence and clear accountability. Engineering management, programme management, and founder/operator roles fit you.',
    growth:    'Leave room for unstructured thinking. The best ideas don\'t always arrive on schedule.' },
  ESFJ: { name: 'Consul',        tags: ['Supportive', 'Loyal', 'Outgoing'],
    strengths: 'You make teams feel heard and aligned. Engineering management, partnerships and customer success thrive on your energy.',
    growth:    'Don\'t let consensus replace clarity \u2014 hard truths shared kindly serve the team better in the long run.' },
  ISTP: { name: 'Virtuoso',      tags: ['Practical', 'Hands-on', 'Calm'],
    strengths: 'You diagnose and fix where others freeze. Hardware, embedded systems, infra and incident response are sweet spots.',
    growth:    'Document your fixes. Your fluent intuition becomes a single point of failure if no one else can follow it.' },
  ISFP: { name: 'Adventurer',    tags: ['Artistic', 'Sensitive', 'Easygoing'],
    strengths: 'You bring craft and aesthetic instinct to whatever you build. Design, frontend, and creative tooling roles let you flourish.',
    growth:    'Make your decisions visible. Strong taste with quiet delivery can be missed in noisy reviews.' },
  ESTP: { name: 'Entrepreneur',  tags: ['Energetic', 'Pragmatic', 'Bold'],
    strengths: 'You move fast and read situations on the fly. Sales engineering, biz dev, and operations under pressure are good fits.',
    growth:    'Pause for long-term consequences. Speed without strategy is rework dressed up as progress.' },
  ESFP: { name: 'Entertainer',   tags: ['Spontaneous', 'Lively', 'Friendly'],
    strengths: 'You energise the room and adapt quickly. Customer-facing engineering, devrel, and event roles suit you.',
    growth:    'Build a routine for boring-but-important work \u2014 maintenance, follow-ups, retros.' },
};

const summaryDisplay = computed(() => {
  const code = (record.value?.resultSummary || '').toUpperCase();
  const meta = MBTI_TYPES[code];
  return meta ? `${code} · ${meta.name}` : (code || 'Result');
});

const typeTags = computed(() => {
  const meta = MBTI_TYPES[(record.value?.resultSummary || '').toUpperCase()];
  return meta ? meta.tags : [];
});

interface InsightView {
  fromAi: boolean;
  strengths: string;
  growth: string;
  suggestedRoles: string[];
}

/**
 * Prefer the AI-generated insight (returned by the backend with the record),
 * fall back to the static MBTI table when AI failed or wasn't run, and a
 * generic message when even that doesn't apply.
 */
const insight = computed<InsightView>(() => {
  const aiRaw = record.value?.aiInsight;
  if (aiRaw) {
    try {
      const parsed = JSON.parse(aiRaw) as {
        strengths?: string;
        growth?: string;
        suggestedRoles?: string[];
      };
      if (parsed?.strengths && parsed?.growth) {
        return {
          fromAi: true,
          strengths: parsed.strengths,
          growth: parsed.growth,
          suggestedRoles: Array.isArray(parsed.suggestedRoles) ? parsed.suggestedRoles : [],
        };
      }
    } catch { /* fall through to static */ }
  }

  const meta = MBTI_TYPES[(record.value?.resultSummary || '').toUpperCase()];
  if (meta) {
    return { fromAi: false, strengths: meta.strengths, growth: meta.growth, suggestedRoles: [] };
  }
  return {
    fromAi: false,
    strengths: 'Your answers reveal a unique combination of traits. Use the dimension breakdown above to identify where you naturally lean.',
    growth:    'Pay attention to the dimensions where the score is lowest \u2014 those are growth areas worth deliberate practice.',
    suggestedRoles: [],
  };
});

/**
 * Convert the raw {dimension: count} JSON into ordered, percentage-scaled
 * rows for the bars. For MBTI we display the 4 axes side-by-side so you
 * see which side dominates; the percent is the dominant share.
 */
interface DimensionRow { name: string; value: number; percent: number; fillClass: string; }

const MBTI_AXES: Array<[string, string, string]> = [
  // [left letter, right letter, label of the axis]
  ['E', 'I', 'Extra/Intro'],
  ['S', 'N', 'Sense/Intu'],
  ['T', 'F', 'Think/Feel'],
  ['J', 'P', 'Judge/Perc'],
];

const FILL_CLASSES = ['fill-logic', 'fill-creative', 'fill-exec', 'fill-team', 'fill-pressure'];

const dimensions = computed<DimensionRow[]>(() => {
  const raw = record.value?.resultJson;
  if (!raw) return [];
  let traits: Record<string, number> = {};
  try { traits = JSON.parse(raw); } catch { return []; }

  const rows: DimensionRow[] = [];
  // MBTI display: dominant letter wins each axis, percent = dominant / (a+b) * 100
  const looksLikeMbti = MBTI_AXES.every(([a, b]) => a in traits || b in traits);
  if (looksLikeMbti) {
    MBTI_AXES.forEach(([a, b], i) => {
      const va = traits[a] || 0;
      const vb = traits[b] || 0;
      const total = va + vb || 1;
      const dominant = va >= vb ? a : b;
      const value = Math.max(va, vb);
      rows.push({
        name: `${dominant} (${a}/${b})`,
        value,
        percent: Math.round((value / total) * 100),
        fillClass: FILL_CLASSES[i % FILL_CLASSES.length],
      });
    });
    return rows;
  }

  // Generic fallback (e.g. Holland): show every dimension scaled to the max.
  const max = Math.max(1, ...Object.values(traits));
  Object.entries(traits)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v], i) => {
      rows.push({
        name: k,
        value: v,
        percent: Math.round((v / max) * 100),
        fillClass: FILL_CLASSES[i % FILL_CLASSES.length],
      });
    });
  return rows;
});

const loadResult = async () => {
  if (!recordId.value) {
    errorMsg.value = 'Missing record id';
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    record.value = await getAssessmentRecordApi(recordId.value);
  } catch (e: any) {
    errorMsg.value = e?.message || 'Failed to load result';
  } finally {
    loading.value = false;
  }
};

const goMap = () => {
  if (record.value?.resultSummary) {
    uni.setStorageSync('assessment_recommended_role', record.value.resultSummary);
  }
  uni.navigateTo({ url: '/pages/map/index?from=assessment' });
};

/**
 * The first AI-suggested role for this profile. Used as the headline CTA
 * label so the user can jump straight from "I'm an INFP" to "okay, let me
 * practice a UX Researcher interview" with one tap. Empty when the AI
 * insight failed and we have no concrete roles to suggest.
 */
const primarySuggestedRole = computed(() => {
  const roles = insight.value.suggestedRoles;
  return roles && roles.length > 0 ? roles[0] : '';
});

/**
 * Bridge from assessment → interview without making the user re-type the role.
 * Persists the chosen role into the cross-tool snapshot (so resume diagnosis
 * + interview start + AI assistant all see it next time), then navigates.
 * The snapshot write is best-effort — even if the network blips we still
 * navigate so the user doesn't get stranded.
 */
const practiceInterview = async () => {
  const role = primarySuggestedRole.value;
  if (!role) return;
  uni.setStorageSync('assessment_recommended_role', role);
  try {
    await updatePreferencesApi({ targetRole: role });
  } catch {
    // Snapshot write failed -- non-fatal, we still hand off to the interview start page.
  }
  uni.navigateTo({ url: `/pages/interview/start?suggestedRole=${encodeURIComponent(role)}` });
};

const goBack = () => {
  // Use redirect so we don't loop back into the quiz when the user pops.
  uni.redirectTo({ url: '/pages/assessment/index' });
};

onMounted(() => {
  refreshTheme();
  const pages = getCurrentPages();
  const opts = (pages[pages.length - 1] as any).options || {};
  recordId.value = parseInt(opts.recordId || '0');
  loadResult();
});

onShow(() => {
  refreshTheme();
  uni.setNavigationBarTitle({ title: t('assessmentResult.navTitle') });
});
</script>

<style scoped>
.result-container {
  min-height: 100vh;
  background-color: #f5f5f7;
  padding: 24px 20px;
  padding-bottom: calc(140px + env(safe-area-inset-bottom));
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  box-sizing: border-box;
}

.result-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
  border-radius: 24px; color: white; margin-bottom: 32px;
  box-shadow: 0 16px 32px -8px rgba(67, 56, 202, 0.4);
}

.result-subtitle { font-size: 14px; font-weight: 500; opacity: 0.8; margin-bottom: 8px; letter-spacing: 1px; }

.result-title { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 20px; }

.tags-container { display: flex; gap: 12px; }

.tag {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  padding: 6px 14px; border-radius: 16px; font-size: 13px; font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section-title {
  font-size: 20px; font-weight: 700; color: #000000;
  letter-spacing: -0.5px; margin-top: 12px; margin-bottom: 16px; padding-left: 4px;
  display: flex; align-items: center; gap: 10px;
}
.section-title-text { font-size: 20px; font-weight: 700; color: inherit; }

/* "AI" pill -- signals the copy below was generated for this specific user */
.ai-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  padding: 3px 8px; border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

/* Suggested-roles chips */
.roles-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.role-chip {
  font-size: 12px; font-weight: 600; color: #2563eb;
  background: #eff6ff; border: 1px solid #dbeafe;
  padding: 6px 12px; border-radius: 999px;
}

.radar-card {
  background-color: #ffffff; border-radius: 24px; padding: 24px; margin-bottom: 32px;
}

.skill-bars { display: flex; flex-direction: column; gap: 20px; }

.skill-row { display: flex; align-items: center; gap: 12px; }

.skill-name { width: 75px; font-size: 14px; font-weight: 600; color: #1c1c1e; }

.bar-bg { flex: 1; height: 8px; background-color: #f2f2f7; border-radius: 4px; overflow: hidden; }

.bar-fill { height: 100%; border-radius: 4px; }

.fill-logic { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.fill-creative { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.fill-exec { background: linear-gradient(90deg, #10b981, #34d399); }
.fill-team { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.fill-pressure { background: linear-gradient(90deg, #ef4444, #f87171); }

.skill-score { width: 24px; font-size: 14px; font-weight: 700; color: #000000; text-align: right; }

.analysis-card { background-color: #ffffff; border-radius: 24px; padding: 24px; margin-bottom: 24px; }

.paragraph { display: flex; flex-direction: column; gap: 8px; }

.p-title { font-size: 16px; font-weight: 600; color: #1c1c1e; letter-spacing: -0.3px; }

.p-content { font-size: 15px; color: #636366; line-height: 1.6; }

.divider { height: 1px; background-color: #f2f2f7; margin: 20px 0; }

.bottom-action {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 16px 20px calc(20px + env(safe-area-inset-bottom)) 20px;
  background: rgba(245, 245, 247, 0.92);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.1);
  z-index: 300; display: flex; flex-direction: column; gap: 12px;
  pointer-events: auto;
}

/* Custom-rendered buttons (using <view>) so mp-weixin's native <button>
   defaults can't override our colours. */
.btn-primary {
  width: 100%; background-color: #2563eb;
  border-radius: 16px;
  height: 52px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.32);
}
.btn-primary-text { color: #ffffff; font-size: 17px; font-weight: 700; }
.btn-primary:active { background-color: #1d4ed8; }

/* Hero CTA when an AI-suggested role exists -- gradient fill so it visually
   leads against the standard solid blue secondary action below it. */
.btn-primary.practice-cta {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 8px 22px rgba(99, 102, 241, 0.36);
}
.btn-primary.practice-cta:active { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }

/* When the practice CTA is present we tone down the map button so the eye
   prioritises the practice action without making the secondary disappear. */
.btn-primary.btn-secondary-tone {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  box-shadow: none;
}
.btn-primary.btn-secondary-tone .btn-primary-text { color: #2563eb; }
.btn-primary.btn-secondary-tone:active { background-color: #f1f5f9; }

.btn-secondary {
  width: 100%; height: 44px;
  display: flex; align-items: center; justify-content: center;
}
.btn-secondary-text { color: #2563eb; font-size: 15px; font-weight: 600; }
.btn-secondary:active { opacity: 0.7; }

/* Loading + error */
.loading-state, .error-state {
  background: #ffffff; border: 1px solid var(--border-color);
  border-radius: 20px; padding: 60px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  margin-top: 12px;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0; border-top-color: #2563eb;
  border-radius: 50%;
  animation: result-spin 0.9s linear infinite;
}
@keyframes result-spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 14px; color: #475569; }
.err-title { font-size: 15px; color: #b91c1c; font-weight: 600; }
.btn-retry {
  background: #2563eb; height: 40px; padding: 0 24px;
  border-radius: 12px;
  display: flex; align-items: center;
}
.btn-retry-text { color: #fff; font-size: 14px; font-weight: 600; }

.is-dark { background-color: #0f172a; }

.is-dark .section-title,
.is-dark .p-title,
.is-dark .skill-name,
.is-dark .skill-score { color: #f8fafc; }

.is-dark .radar-card,
.is-dark .analysis-card,
.is-dark .bottom-action { background-color: #1e293b; border-color: #334155; }

.is-dark .p-content,
.is-dark .result-subtitle { color: #94a3b8; }
</style>