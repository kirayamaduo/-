<template>
  <div>
    <div class="toolbar">
      <el-select v-model="filterType" placeholder="全部类型" clearable style="width:180px" @change="loadLogs">
        <el-option label="USER" value="USER" />
        <el-option label="QUESTION" value="QUESTION" />
        <el-option label="HOME_ARTICLE" value="HOME_ARTICLE" />
        <el-option label="HOME_VIDEO" value="HOME_VIDEO" />
        <el-option label="NOTIFICATION" value="NOTIFICATION" />
      </el-select>
      <el-button @click="loadLogs">刷新</el-button>
    </div>

    <el-table :data="logs" v-loading="loading" stripe border style="width:100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="adminId" label="管理员 ID" width="100" />
      <el-table-column prop="action" label="操作" width="160">
        <template #default="{ row }">
          <el-tag
            :type="actionTagType(row.action)"
            size="small"
            effect="plain"
          >{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="targetType" label="对象类型" width="130" />
      <el-table-column prop="targetId" label="对象 ID" width="90" />
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column prop="createdAt" label="时间" width="175" />
      <el-table-column label="详情" fixed="right" width="80">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadLogs"
      />
    </div>

    <!-- Detail dialog -->
    <el-dialog v-model="detailDialog" title="操作详情" width="620px">
      <div v-if="selected">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="ID">{{ selected.id }}</el-descriptions-item>
          <el-descriptions-item label="管理员 ID">{{ selected.adminId }}</el-descriptions-item>
          <el-descriptions-item label="操作">{{ selected.action }}</el-descriptions-item>
          <el-descriptions-item label="对象类型">{{ selected.targetType }}</el-descriptions-item>
          <el-descriptions-item label="对象 ID">{{ selected.targetId }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ selected.ip }}</el-descriptions-item>
          <el-descriptions-item label="User-Agent" :span="2">{{ selected.ua }}</el-descriptions-item>
          <el-descriptions-item label="时间" :span="2">{{ selected.createdAt }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="selected.beforeJson || selected.afterJson" style="margin-top:12px">
          <el-tabs>
            <el-tab-pane v-if="selected.beforeJson" label="变更前">
              <pre class="json-block">{{ fmtJson(selected.beforeJson) }}</pre>
            </el-tab-pane>
            <el-tab-pane v-if="selected.afterJson" label="变更后">
              <pre class="json-block">{{ fmtJson(selected.afterJson) }}</pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api';

interface AuditLogRow {
  id: number;
  adminId: number;
  action: string;
  targetType: string;
  targetId?: string;
  beforeJson?: string;
  afterJson?: string;
  ip?: string;
  ua?: string;
  createdAt?: string;
}

const logs = ref<AuditLogRow[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(30);
const total = ref(0);
const filterType = ref('');

const detailDialog = ref(false);
const selected = ref<AuditLogRow | null>(null);

const loadLogs = async () => {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: page.value - 1,
      size: pageSize.value,
    };
    if (filterType.value) params.targetType = filterType.value;
    const data: any = await http.get('/api/admin/audit-log', { params });
    logs.value = data.content ?? [];
    total.value = data.totalElements ?? 0;
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const viewDetail = (row: AuditLogRow) => {
  selected.value = row;
  detailDialog.value = true;
};

const actionTagType = (action: string): '' | 'success' | 'warning' | 'danger' | 'info' => {
  if (action.startsWith('DELETE')) return 'danger';
  if (action.startsWith('BAN')) return 'warning';
  if (action.startsWith('UNBAN')) return 'success';
  if (action.startsWith('CREATE')) return 'success';
  return '';
};

const fmtJson = (str?: string) => {
  if (!str) return '';
  try { return JSON.stringify(JSON.parse(str), null, 2); }
  catch { return str; }
};

onMounted(() => loadLogs());
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.pager { display: flex; justify-content: flex-end; margin-top: 16px; }
.json-block { background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 12px; overflow: auto; max-height: 280px; }
</style>
