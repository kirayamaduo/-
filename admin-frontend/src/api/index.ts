import axios from 'axios';

// Same-origin: vite dev server proxies /api to localhost:8080.
const http = axios.create({ baseURL: '', timeout: 30_000 });

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (res) => {
    // Backend wraps every response in {code, message, data}; unwrap so
    // call sites don't have to handle that consistently themselves.
    if (res.data && typeof res.data.code !== 'undefined') {
      if (res.data.code === 200) return res.data.data;
      return Promise.reject(new Error(res.data.message || 'Request failed'));
    }
    return res.data;
  },
  (err) => Promise.reject(err)
);

export interface OrgDashboard {
  orgId: number;
  studentCount: number;
  interviewCount: number;
  reportCount: number;
  radarAverages: Record<string, number>;
  weakDimensionsTop3: string[];
}

export interface StudentRow {
  userId: number;
  nickname: string;
  school?: string;
  major?: string;
  interviewCount: number;
  lastInterviewScore?: number;
}

export interface CareerPath { pathId?: number; code: string; name: string; description?: string; }
export interface CareerNode {
  nodeId?: number;
  pathId: number;
  name: string;
  description?: string;
  iconUrl?: string;
  level?: number;
  sortOrder?: number;
  estimatedHours?: number;
  parentId?: number;
}

export interface InterviewQuestion {
  id?: number;
  position: string;
  difficulty: string;
  content: string;
  summary?: string;
  answer?: string;
  likes?: number;
  drawCount?: number;
  status?: string;
  source?: string;
  reviewStatus?: string;
  createdAt?: string;
}

export interface Organization {
  orgId?: number;
  code: string;
  name: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  active?: boolean;
}

export interface UserFeedback {
  id: number;
  userId?: number;
  category: string;
  content: string;
  contact?: string;
  status: string;
  repliedAt?: string;
  createdAt?: string;
}

// Typed wrappers that reflect what the response interceptor actually returns.
function $get<T>(url: string, config?: Parameters<typeof http.get>[1]): Promise<T> {
  return http.get(url, config) as unknown as Promise<T>;
}
function $post<T>(url: string, data?: unknown, config?: Parameters<typeof http.post>[2]): Promise<T> {
  return http.post(url, data, config) as unknown as Promise<T>;
}
function $delete<T>(url: string): Promise<T> {
  return http.delete(url) as unknown as Promise<T>;
}

export const api = {
  // Auth — admin reuses the C-side /auth/login then checks /admin/whoami.
  login: (email: string, password: string) =>
    axios.post('/auth/login', { identityType: 'EMAIL_PASSWORD', identifier: email, credential: password })
      .then((r) => r.data?.data || r.data),
  whoami: () => $get<boolean>('/api/admin/whoami'),

  // Organizations + dashboard
  listOrgs: () => $get<Organization[]>('/api/admin/organizations'),
  saveOrg: (payload: Organization) => $post<Organization>('/api/admin/organizations', payload),
  orgDashboard: (orgId: number) => $get<OrgDashboard>(`/api/admin/organizations/${orgId}/dashboard`),
  orgStudents: (orgId: number) => $get<StudentRow[]>(`/api/admin/organizations/${orgId}/students`),

  // Skill map
  listPaths: () => $get<CareerPath[]>('/api/admin/career-paths'),
  savePath: (p: CareerPath) => $post<CareerPath>('/api/admin/career-paths', p),
  deletePath: (pathId: number) => $delete<void>(`/api/admin/career-paths/${pathId}`),
  listNodes: (pathId: number) => $get<CareerNode[]>(`/api/admin/career-paths/${pathId}/nodes`),
  saveNode: (pathId: number, n: CareerNode) =>
    $post<CareerNode>(`/api/admin/career-paths/${pathId}/nodes`, n),
  deleteNode: (nodeId: number) => $delete<void>(`/api/admin/career-paths/nodes/${nodeId}`),

  // Question bank
  listQuestions: (params?: { source?: string; reviewStatus?: string }) =>
    $get<InterviewQuestion[]>('/api/admin/questions', { params }),
  listPendingReview: () =>
    $get<InterviewQuestion[]>('/api/admin/questions', { params: { reviewStatus: 'PENDING_REVIEW' } }),
  approveQuestion: (id: number) => $post<InterviewQuestion>(`/api/admin/questions/${id}/approve`, {}),
  rejectQuestion: (id: number) => $post<InterviewQuestion>(`/api/admin/questions/${id}/reject`, {}),
  updateQuestion: (id: number, payload: Partial<InterviewQuestion>) =>
    $post<InterviewQuestion>(`/api/admin/questions/${id}`, payload),
  deleteQuestion: (id: number) => $delete<void>(`/api/admin/questions/${id}`),

  // Weekly report
  runWeeklyReport: () => $post<{ delivered: number; skipped: number }>('/api/admin/weekly-report/run'),

  // Feedback
  listFeedbacks: (params?: { page?: number; size?: number; status?: string }) =>
    $get<{ content: UserFeedback[]; totalElements: number }>('/api/admin/feedback', { params }),
  updateFeedbackStatus: (id: number, status: string) =>
    $post<UserFeedback>(`/api/admin/feedback/${id}/status`, { status }),
};

export default http;
