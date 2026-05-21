<template>
  <div>
    <!-- Stat cards -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-num">{{ summary?.totalUsers ?? '—' }}</div>
          <div class="stat-label">注册用户</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-num">{{ summary?.totalInterviews ?? '—' }}</div>
          <div class="stat-label">累计面试</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-num">{{ summary?.totalAssessments ?? '—' }}</div>
          <div class="stat-label">累计测评</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-num">{{ summary?.totalCheckIns ?? '—' }}</div>
          <div class="stat-label">累计打卡</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Event breakdown chart -->
    <el-card shadow="never" style="margin-top:20px">
      <template #header>
        <span style="font-weight:700">近 30 天行为事件分布</span>
      </template>
      <div v-if="loading" style="text-align:center;padding:60px">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      </div>
      <div v-else-if="eventEntries.length === 0" class="empty-tip">
        暂无 usage_events 数据（用户行为埋点后此处显示）
      </div>
      <div v-else>
        <div v-for="([type, count]) in eventEntries" :key="type" class="event-row">
          <span class="event-type">{{ eventLabel(type) }}</span>
          <el-progress
            :percentage="Math.round((count / maxEventCount) * 100)"
            :format="() => String(count)"
            :stroke-width="18"
            style="flex:1;margin:0 12px"
          />
          <span class="event-count">{{ count.toLocaleString() }}</span>
        </div>
      </div>
    </el-card>

    <!-- Raw JSON (collapsible) -->
    <el-collapse style="margin-top:16px">
      <el-collapse-item title="原始数据 JSON" name="raw">
        <pre class="raw-json">{{ JSON.stringify(summary, null, 2) }}</pre>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import http from '@/api';

interface AnalyticsSummary {
  totalUsers: number;
  totalInterviews: number;
  totalAssessments: number;
  totalCheckIns: number;
  eventBreakdown30d: Record<string, number>;
}

const summary = ref<AnalyticsSummary | null>(null);
const loading = ref(false);

const EVENT_LABELS: Record<string, string> = {
  AI_PROACTIVE_SENT:    'AI 主动推送任务',
  INTERVIEW_STARTED:    '开始面试',
  INTERVIEW_COMPLETED:  '完成面试',
  ASSESSMENT_STARTED:   '开始测评',
  ASSESSMENT_COMPLETED: '完成测评',
  RESUME_UPLOADED:      '上传简历',
  RESUME_DIAGNOSED:     '简历诊断',
  CHECKIN:              '每日打卡',
  TASK_COMPLETED:       '完成任务',
  LOGIN:                '登录',
  ONBOARDING_DONE:      '完成引导',
  MEMORY_VIEWED:        '查看 AI 记忆',
  AGENT_VIEWED:         '查看 Agent',
};

const eventEntries = computed<[string, number][]>(() => {
  if (!summary.value?.eventBreakdown30d) return [];
  return Object.entries(summary.value.eventBreakdown30d).sort((a, b) => b[1] - a[1]);
});

const eventLabel = (type: string) => EVENT_LABELS[type] ?? type;

const maxEventCount = computed(() => {
  if (!eventEntries.value.length) return 1;
  return eventEntries.value[0][1];
});

const loadSummary = async () => {
  loading.value = true;
  try {
    summary.value = await http.get<AnalyticsSummary>('/api/admin/analytics/summary') as any;
  } catch (e: any) {
    ElMessage.error(e?.message || '加载统计失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadSummary());
</script>

<style scoped>
.stat-row { margin-bottom: 4px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-num { font-size: 32px; font-weight: 800; color: #0f766e; line-height: 1.2; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }
.event-row { display: flex; align-items: center; margin-bottom: 10px; }
.event-type { width: 240px; font-size: 13px; color: #334155; white-space: nowrap; }
.event-count { width: 60px; text-align: right; font-size: 13px; color: #64748b; }
.empty-tip { color: #94a3b8; text-align: center; padding: 48px 0; font-size: 14px; }
.raw-json { background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; overflow: auto; max-height: 300px; }
</style>
