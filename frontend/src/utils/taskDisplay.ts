import { normalizeProductCopy } from '@/utils/displayText';

interface TaskLike {
  taskId?: number;
  title?: string;
  description?: string;
  taskType?: string;
  type?: string;
  source?: string;
  target?: string;
  status?: string;
  estimatedMinutes?: number;
}

interface ActionLike {
  label?: string;
  target?: string;
  type?: string;
  source?: string;
  priority?: string;
}

const taskTypeOf = (task?: TaskLike | null) => (task?.taskType || task?.type || '').toUpperCase();
const actionTypeOf = (action?: ActionLike | null) => (action?.type || '').toUpperCase();
const actionSourceOf = (action?: ActionLike | null) => action?.source || 'DAILY_AGENT';
const taskSourceOf = (task?: TaskLike | null) => task?.source || 'DAILY_AGENT';

export const taskMatchesAction = (task?: TaskLike | null, action?: ActionLike | null) => {
  if (!task || !action) return false;
  const sameType = taskTypeOf(task) === actionTypeOf(action);
  const sameTarget = (task.target || '') === (action.target || '');
  const sameSource = taskSourceOf(task) === actionSourceOf(action);
  return sameType && sameTarget && sameSource;
};

export const selectPrimaryTask = <T extends TaskLike>(tasks: T[] = [], actions: ActionLike[] = []): T | undefined => {
  const openTasks = tasks.filter((task) => (task.status || 'TODO') === 'TODO');
  for (const action of actions) {
    const match = openTasks.find((task) => taskMatchesAction(task, action));
    if (match) return match;
  }
  return openTasks[0];
};

export const taskTitle = (task?: TaskLike | null) =>
  normalizeProductCopy(task?.title || '完成一个求职准备动作');

export const taskDescription = (task?: TaskLike | null, fallback = '根据你的当前阶段安排的今日求职任务。') =>
  normalizeProductCopy(task?.description || fallback);

export const taskOutcome = (task?: TaskLike | null) => {
  const type = taskTypeOf(task);
  if (type === 'RESUME') return '一份更接近可投递状态的简历材料';
  if (type === 'INTERVIEW') return '一次面试练习结果和可改进维度';
  if (type === 'ASSESSMENT') return '目标方向、岗位建议和后续准备重点';
  if (type === 'TARGET_ROLE') return '一个更清晰的目标岗位方向';
  if (type === 'PLAN' || task?.source === 'PLAN_WEEKLY') return '一份更清楚的本周求职行动安排';
  if (type === 'CHAT') return '一条更明确的修改方向和行动建议';
  if (type === 'CHECKIN') return '一次可记录的行动连续性进展';
  if (task?.estimatedMinutes) return `${task.estimatedMinutes} 分钟内推进一个可记录的进展`;
  return '完成后更新你的求职准备进度';
};

export const taskCta = (task?: TaskLike | null) => {
  const type = taskTypeOf(task);
  if (type === 'RESUME') return '完善简历';
  if (type === 'INTERVIEW') return '开始练习';
  if (type === 'ASSESSMENT') return '开始测评';
  if (type === 'TARGET_ROLE') return '选择方向';
  if (type === 'PLAN' || task?.source === 'PLAN_WEEKLY') return '查看计划';
  if (type === 'LEARNING') return '查看路线';
  if (type === 'CHAT') return '开始对话';
  if (type === 'CHECKIN') return '记录行动';
  return '开始今日行动';
};

export const taskTarget = (task?: TaskLike | null) => {
  if (task?.target) return task.target;
  const type = taskTypeOf(task);
  if (type === 'RESUME') return '/pages/resume/index';
  if (type === 'INTERVIEW') return '/pages/interview/start';
  if (type === 'ASSESSMENT') return '/pages/assessment/index';
  if (type === 'TARGET_ROLE') return '/pages/map/index';
  if (type === 'PLAN') return '/pages/agent/index';
  if (type === 'LEARNING') return '/pages/map/index';
  if (type === 'CHAT') return '/pages/assistant/index';
  if (type === 'CHECKIN') return '/pages/checkin/index';
  return '/pages/agent/index';
};
