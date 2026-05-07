import request from '@/utils/request';

// ─── F28c: AI Career Plan ────────────────────────────────────────────────────

export interface CareerMilestone {
  horizon: '6m' | '1y' | '3y' | '5y';
  title: string;
  skills: string[];
  actions: string[];
  kpis: string[];
}

export interface CareerStartState {
  education?: string;
  skills?: string[];
  experience?: string;
}

export interface UserCareerPlan {
  id?: number;
  userId?: number;
  targetRole?: string;
  startStateJson?: string;
  milestonesJson?: string;
  weeklyFocusJson?: string;
  modelUsed?: string;
  generatedAt?: string;
  lastUpdatedAt?: string;
  version?: number;
  // parsed helpers (set client-side after parsing JSON fields)
  startState?: CareerStartState;
  milestones?: CareerMilestone[];
  weeklyFocus?: string[];
}

export const generateCareerPlanApi = (targetRole?: string) => {
  return request<UserCareerPlan>({
    url: '/api/careers/plan/generate',
    method: 'POST',
    data: { targetRole: targetRole || null },
  });
};

export const getCurrentCareerPlanApi = () => {
  // silent:true — 新用户无规划时返回 401/404，不弹 toast 也不触发全局登录重定向
  // map/index.vue 的 loadPlan() 已用 catch{} 静默处理空状态
  return request<UserCareerPlan | null>({
    url: '/api/careers/plan/current',
    method: 'GET',
    silent: true,
  });
};

// ─── Career Paths & Progress ─────────────────────────────────────────────────

export interface CareerPath {
  pathId?: number;
  code: string;
  name: string;
  description?: string;
}

export interface CareerNode {
  nodeId?: number;
  pathId: number;
  name: string;
  level: number;
  parentId: number;
  description?: string;
  estimatedHours?: number;
  sortOrder?: number;
  iconUrl?: string;
}

export interface UserCareerProgress {
  id?: number;
  userId: number;
  nodeId: number;
  status: string; // 'LOCKED', 'UNLOCKED', 'COMPLETED'
  updatedAt?: string;
}

/**
 * Get all career paths
 */
export const getCareerPathsApi = () => {
  return request<CareerPath[]>({
    url: '/api/careers/paths',
    method: 'GET',
  });
};

/**
 * Get career path by ID
 */
export const getCareerPathByIdApi = (pathId: number) => {
  return request<CareerPath>({
    url: `/api/careers/paths/${pathId}`,
    method: 'GET',
  });
};

/**
 * Get nodes for a career path
 */
export const getPathNodesApi = (pathId: number) => {
  return request<CareerNode[]>({
    url: `/api/careers/paths/${pathId}/nodes`,
    method: 'GET',
  });
};

/**
 * Get user's career progress
 */
export const getUserProgressApi = (userId: number) => {
  return request<UserCareerProgress[]>({
    url: `/api/careers/progress/${userId}`,
    method: 'GET',
  });
};

/**
 * Unlock a node for user
 */
export const unlockNodeApi = (userId: number, nodeId: number) => {
  return request<string>({
    url: '/api/careers/progress/unlock',
    method: 'POST',
    data: { userId, nodeId },
  });
};

/**
 * Complete a node for user
 */
export const completeNodeApi = (userId: number, nodeId: number) => {
  return request<string>({
    url: '/api/careers/progress/complete',
    method: 'POST',
    data: { userId, nodeId },
  });
};

/**
 * Initialize default career paths (for testing)
 */
export const initializeCareerPathsApi = () => {
  return request<string>({
    url: '/api/careers/initialize',
    method: 'POST',
  });
};

