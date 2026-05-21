<template>
  <div>
    <el-row :gutter="24">
      <!-- Send form -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><span style="font-weight:700">发送公告</span></template>
          <el-form :model="form" label-position="top">
            <el-form-item label="目标用户">
              <el-radio-group v-model="targetMode">
                <el-radio value="all">全部活跃用户</el-radio>
                <el-radio value="single">指定用户 ID</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="targetMode === 'single'" label="用户 ID">
              <el-input v-model="form.userId" placeholder="输入用户 ID" type="number" />
            </el-form-item>
            <el-form-item label="标题 *">
              <el-input v-model="form.title" placeholder="通知标题" maxlength="80" show-word-limit />
            </el-form-item>
            <el-form-item label="内容 *">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="5"
                placeholder="通知正文"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="跳转链接（可选）">
              <el-input v-model="form.link" placeholder="/pages/…" />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="sending"
                style="width:100%"
                @click="sendBroadcast"
              >
                发送公告
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- History -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">发送历史（系统 / 广播通知）</span>
              <el-button size="small" @click="loadHistory">刷新</el-button>
            </div>
          </template>
          <el-table :data="history" v-loading="loadingHistory" stripe style="width:100%" max-height="520">
            <el-table-column prop="notificationId" label="ID" width="70" />
            <el-table-column prop="type" label="类型" width="130">
              <template #default="{ row }">
                <el-tag :type="row.type === 'ADMIN_BROADCAST' ? 'warning' : 'info'" size="small">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="发送时间" width="175" />
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="histPage"
              v-model:page-size="histPageSize"
              :total="histTotal"
              layout="total, prev, pager, next"
              @current-change="loadHistory"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api';

interface NotifRow { notificationId: number; type: string; title: string; content?: string; createdAt?: string; }

const targetMode = ref<'all' | 'single'>('all');
const form = ref({ userId: '', title: '', content: '', link: '' });
const sending = ref(false);

const history = ref<NotifRow[]>([]);
const loadingHistory = ref(false);
const histPage = ref(1);
const histPageSize = ref(20);
const histTotal = ref(0);

const sendBroadcast = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    ElMessage.warning('标题和内容不能为空');
    return;
  }
  sending.value = true;
  try {
    const body: Record<string, string | number | null> = {
      title: form.value.title,
      content: form.value.content,
      link: form.value.link || null,
      userId: targetMode.value === 'single' && form.value.userId ? Number(form.value.userId) : null,
    };
    const count = await http.post<number>('/api/admin/broadcast', body) as any;
    ElMessage.success(`公告已发送给 ${count} 位用户`);
    form.value = { userId: '', title: '', content: '', link: '' };
    loadHistory();
  } catch (e: any) {
    ElMessage.error(e?.message || '发送失败');
  } finally {
    sending.value = false;
  }
};

const loadHistory = async () => {
  loadingHistory.value = true;
  try {
    const data: any = await http.get('/api/admin/notifications', {
      params: { page: histPage.value - 1, size: histPageSize.value }
    });
    history.value = data.content ?? [];
    histTotal.value = data.totalElements ?? 0;
  } catch {
    history.value = [];
  } finally {
    loadingHistory.value = false;
  }
};

onMounted(() => loadHistory());
</script>

<style scoped>
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
