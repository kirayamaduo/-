<template>
  <div>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- ── All Questions Tab ── -->
      <el-tab-pane label="All Questions" name="all">
        <el-card>
          <div class="row-controls">
            <el-input v-model="filter" placeholder="Filter by position or content..." clearable style="max-width: 280px;" />
            <el-select v-model="sourceFilter" placeholder="Source" clearable style="width:160px;">
              <el-option label="All Sources" value="" />
              <el-option label="Official" value="OFFICIAL" />
              <el-option label="User" value="USER" />
              <el-option label="AI Generated" value="AI_GENERATED" />
            </el-select>
            <el-button @click="loadAll">Reload</el-button>
          </div>
        </el-card>
        <el-card style="margin-top: 16px;">
          <el-table :data="filteredAll" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="position" label="Position" width="180" />
            <el-table-column prop="difficulty" label="Difficulty" width="100" />
            <el-table-column prop="content" label="Content" />
            <el-table-column prop="source" label="Source" width="110">
              <template #default="{ row }">
                <el-tag :type="sourceTagType(row.source)" size="small">{{ row.source }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="90" />
            <el-table-column label="Actions" width="220">
              <template #default="{ row }">
                <el-button size="small" @click="edit(row)">Edit</el-button>
                <el-button v-if="row.status === 'APPROVED'" size="small" @click="setStatus(row, 'HIDDEN')">Hide</el-button>
                <el-button v-else size="small" @click="setStatus(row, 'APPROVED')">Show</el-button>
                <el-button size="small" type="danger" @click="remove(row)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ── AI Review Queue Tab ── -->
      <el-tab-pane name="review">
        <template #label>
          <span>AI Review Queue <el-badge :value="pendingItems.length" :max="99" type="danger" style="margin-left:4px;" /></span>
        </template>
        <el-card>
          <div class="row-controls">
            <span class="review-hint">Review AI-generated questions before they appear in the public market.</span>
            <el-button @click="loadPending">Reload</el-button>
          </div>
        </el-card>
        <el-card style="margin-top: 16px;">
          <el-empty v-if="pendingItems.length === 0" description="No questions pending review 🎉" />
          <el-table v-else :data="pendingItems" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="position" label="Position" width="160" />
            <el-table-column prop="difficulty" label="Diff" width="80" />
            <el-table-column prop="content" label="Question" />
            <el-table-column prop="answer" label="Reference Answer" width="260" show-overflow-tooltip />
            <el-table-column label="Actions" width="180">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="approve(row)">✓ Approve</el-button>
                <el-button size="small" type="danger" @click="reject(row)">✗ Reject</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Edit dialog -->
    <el-dialog v-model="dialogVisible" title="Edit question" width="640px">
      <el-form :model="form" label-position="top">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="Position"><el-input v-model="form.position" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="Difficulty">
            <el-select v-model="form.difficulty"><el-option label="Easy" value="Easy" /><el-option label="Normal" value="Normal" /><el-option label="Hard" value="Hard" /></el-select>
          </el-form-item></el-col>
          <el-col :span="6"><el-form-item label="Status">
            <el-select v-model="form.status"><el-option label="APPROVED" value="APPROVED" /><el-option label="HIDDEN" value="HIDDEN" /></el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="Summary"><el-input v-model="form.summary" /></el-form-item>
        <el-form-item label="Content"><el-input v-model="form.content" type="textarea" :autosize="{ minRows: 4 }" /></el-form-item>
        <el-form-item label="Reference Answer"><el-input v-model="form.answer" type="textarea" :autosize="{ minRows: 3 }" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="save">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { api, type InterviewQuestion } from '@/api';

const activeTab = ref('all');
const allItems = ref<InterviewQuestion[]>([]);
const pendingItems = ref<InterviewQuestion[]>([]);
const filter = ref('');
const sourceFilter = ref('');
const dialogVisible = ref(false);
const form = reactive<InterviewQuestion>({
  id: undefined, position: '', difficulty: 'Normal', content: '', summary: '', answer: '', status: 'APPROVED'
});

const filteredAll = computed(() => {
  let list = allItems.value;
  if (sourceFilter.value) list = list.filter(i => i.source === sourceFilter.value);
  if (!filter.value) return list;
  const q = filter.value.toLowerCase();
  return list.filter(i => (i.position || '').toLowerCase().includes(q) || (i.content || '').toLowerCase().includes(q));
});

const sourceTagType = (source?: string) => {
  if (source === 'OFFICIAL') return 'success';
  if (source === 'AI_GENERATED') return 'warning';
  return 'info';
};

const loadAll = async () => {
  try { allItems.value = (await api.listQuestions()) as unknown as InterviewQuestion[]; } catch (e: any) { ElMessage.error(e?.message || 'Failed'); }
};

const loadPending = async () => {
  try { pendingItems.value = (await api.listPendingReview()) as unknown as InterviewQuestion[]; } catch (e: any) { ElMessage.error(e?.message || 'Failed'); }
};

const onTabChange = (tab: string) => {
  if (tab === 'review') loadPending();
};

const edit = (row: InterviewQuestion) => {
  Object.assign(form, row);
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.id) return;
  try {
    await api.updateQuestion(form.id, form);
    dialogVisible.value = false;
    ElMessage.success('Saved');
    loadAll();
  } catch (e: any) { ElMessage.error(e?.message || 'Failed'); }
};

const setStatus = async (row: InterviewQuestion, status: string) => {
  if (!row.id) return;
  try {
    await api.updateQuestion(row.id, { status });
    ElMessage.success(status === 'HIDDEN' ? 'Hidden' : 'Shown');
    loadAll();
  } catch (e: any) { ElMessage.error(e?.message || 'Failed'); }
};

const approve = async (row: InterviewQuestion) => {
  if (!row.id) return;
  try {
    await api.approveQuestion(row.id);
    ElMessage.success('Question approved and published');
    loadPending();
    loadAll();
  } catch (e: any) { ElMessage.error(e?.message || 'Failed'); }
};

const reject = async (row: InterviewQuestion) => {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm('Reject and hide this question?', 'Confirm', { type: 'warning' });
    await api.rejectQuestion(row.id);
    ElMessage.success('Question rejected');
    loadPending();
  } catch {}
};

const remove = async (row: InterviewQuestion) => {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm('Delete this question?', 'Confirm', { type: 'warning' });
    await api.deleteQuestion(row.id);
    ElMessage.success('Deleted');
    loadAll();
  } catch {}
};

onMounted(loadAll);
</script>

<style scoped>
.row-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.review-hint { font-size: 13px; color: #909399; }
</style>
