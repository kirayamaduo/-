import request from '@/utils/request';

export interface CareerAgentAction {
  label: string;
  labelKey?: string;
  target: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  source?: string;
}

export interface CareerAgentToday {
  stage: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  headline: string;
  headlineKey?: string;
  reason: string;
  reasonKey?: string;
  todayFocus: string;
  focusKey?: string;
  progressPercent: number;
  riskReasons: string[];
  riskReasonKeys?: string[];
  actions: CareerAgentAction[];
}

export interface AgentTask {
  taskId: number;
  title: string;
  description?: string;
  taskType: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  status: 'TODO' | 'DONE' | 'DISMISSED' | string;
  target?: string;
  source?: string;
  dueDate?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  estimatedMinutes?: number;
  parentTaskId?: number;
  subIndex?: number;
}

export interface CareerAgentRiskItem {
  code: string;
  title: string;
  titleKey?: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  trend: 'RISING' | 'STABLE' | 'DECREASING' | string;
  score: number;
  reason: string;
  reasonKey?: string;
  recommendation: string;
  recommendationKey?: string;
}

export interface CareerAgentRiskWatch {
  overallLevel: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  primaryRiskCode: string;
  primaryRiskTitle: string;
  summary: string;
  risks: CareerAgentRiskItem[];
}

export interface CareerAgentPlanSummary {
  hasPlan: boolean;
  targetRole?: string;
  planHealth: 'ON_TRACK' | 'NEEDS_REFRESH' | 'MISSING' | string;
  adjustmentReason: string;
  nextMilestoneHorizon?: string;
  nextMilestoneTitle?: string;
  weeklyFocus: string[];
  generatedAt?: string;
  lastUpdatedAt?: string;
  version?: number;
}

export interface AgentMissingSignal {
  key: string;
  label: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
}

export interface AgentReadiness {
  overallPercent: number;
  resumeScore: number;
  interviewScore: number;
  hasAssessment: boolean;
  hasResume: boolean;
  hasInterview: boolean;
  hasPlan: boolean;
  directionClarityPercent?: number;
  resumeReadinessPercent?: number;
  interviewReadinessPercent?: number;
  actionContinuityPercent?: number;
}

export interface AgentBehavior {
  streakDays: number;
  weeklyDays: number;
  todayCompleted: number;
  todayTotal: number;
  completionRate7d: number;
  dismissRate7d: number;
  preferredDifficulty: string;
}

export interface AgentSkillEntry {
  name: string;
  category: string;
  level: number;
  source: string;
}

export interface AgentUserProfile {
  personalizationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  completenessScore: number;
  currentStage: string;
  target?: { role?: string; source?: string; confidence?: number };
  readiness?: AgentReadiness;
  behavior?: AgentBehavior;
  skills?: AgentSkillEntry[];
  missingSignals?: AgentMissingSignal[];
  evidence?: Record<string, string>;
  generatedAt?: string;
  updatedAt?: string;
}

export interface ProfileInputsRequest {
  targetCity?: string;
  targetIndustry?: string;
  timeline?: string;
  weeklyHours?: string;
  preferredDifficulty?: string;
  considerGradSchool?: boolean;
  considerStudyAbroad?: boolean;
  careerGoalNote?: string;
}

export const saveProfileInputsApi = (req: ProfileInputsRequest) =>
  request<AgentUserProfile>({ url: '/api/agent/profile/inputs', method: 'POST', data: req });

export const getAgentProfileApi = () =>
  request<AgentUserProfile>({ url: '/api/agent/profile', method: 'GET', silent: true });

export const refreshAgentProfileApi = () =>
  request<AgentUserProfile>({ url: '/api/agent/profile/refresh', method: 'POST' });

export const getCareerAgentTodayApi = () =>
  request<CareerAgentToday>({ url: '/api/agent/today', method: 'GET', silent: true });

export const getCareerAgentRiskWatchApi = () =>
  request<CareerAgentRiskWatch>({ url: '/api/agent/risk-watch', method: 'GET', silent: true });

export const getCareerAgentPlanSummaryApi = () =>
  request<CareerAgentPlanSummary>({ url: '/api/agent/plan-summary', method: 'GET', silent: true });

export const ensureCareerAgentPlanApi = () =>
  request<CareerAgentPlanSummary>({ url: '/api/agent/plan/ensure', method: 'POST' });

export const getTodayAgentTasksApi = () =>
  request<AgentTask[]>({ url: '/api/agent/tasks/today', method: 'GET', silent: true });

export const completeAgentTaskApi = (taskId: number) =>
  request<AgentTask>({ url: `/api/agent/tasks/${taskId}/complete`, method: 'POST' });

export const dismissAgentTaskApi = (taskId: number) =>
  request<AgentTask>({ url: `/api/agent/tasks/${taskId}/dismiss`, method: 'POST' });

export const decomposeTaskApi = (taskId: number) =>
  request<AgentTask[]>({ url: `/api/agent/tasks/${taskId}/decompose`, method: 'POST' });

export const getSubtasksApi = (taskId: number) =>
  request<AgentTask[]>({ url: `/api/agent/tasks/${taskId}/subtasks`, method: 'GET', silent: true });

export interface AgentState {
  userId: number;
  currentStage?: string;
  primaryGoal?: string;
  primaryRiskCode?: string;
  taskCompletionRate7d: number;
  taskDismissRate7d: number;
  preferredTaskDifficulty: string;
  lastActiveAt?: string;
  lastWeeklyReviewAt?: string;
  updatedAt?: string;
}

export interface AgentEvent {
  eventId: number;
  userId: number;
  eventType: string;
  eventPayload?: string;
  source: string;
  createdAt?: string;
}

export const getAgentStateApi = () =>
  request<AgentState>({ url: '/api/agent/state', method: 'GET', silent: true });

export const getWeeklyReviewLatestApi = () =>
  request<AgentEvent | null>({ url: '/api/agent/weekly-review/latest', method: 'GET', silent: true });

export const getAgentEventsApi = (limit = 20) =>
  request<AgentEvent[]>({ url: `/api/agent/events?limit=${limit}`, method: 'GET', silent: true });

export interface AgentBundle {
  today: CareerAgentToday;
  tasks: AgentTask[];
  risk: CareerAgentRiskWatch;
  plan: CareerAgentPlanSummary;
  profile: AgentUserProfile;
}

export const getAgentBundleApi = () =>
  request<AgentBundle>({ url: '/api/agent/bundle', method: 'GET', silent: true });
