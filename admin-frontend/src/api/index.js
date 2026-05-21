import axios from 'axios';
// Same-origin: vite dev server proxies /api to localhost:8080.
const http = axios.create({ baseURL: '', timeout: 30_000 });
http.interceptors.request.use((cfg) => {
    const token = localStorage.getItem('admin_token');
    if (token)
        cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});
http.interceptors.response.use((res) => {
    // Backend wraps every response in {code, message, data}; unwrap so
    // call sites don't have to handle that consistently themselves.
    if (res.data && typeof res.data.code !== 'undefined') {
        if (res.data.code === 200)
            return res.data.data;
        return Promise.reject(new Error(res.data.message || 'Request failed'));
    }
    return res.data;
}, (err) => Promise.reject(err));
// Typed wrappers that reflect what the response interceptor actually returns.
function $get(url, config) {
    return http.get(url, config);
}
function $post(url, data, config) {
    return http.post(url, data, config);
}
function $delete(url) {
    return http.delete(url);
}
export const api = {
    // Auth — admin reuses the C-side /auth/login then checks /admin/whoami.
    login: (email, password) => axios.post('/auth/login', { identityType: 'EMAIL_PASSWORD', identifier: email, credential: password })
        .then((r) => r.data?.data || r.data),
    whoami: () => $get('/api/admin/whoami'),
    // Organizations + dashboard
    listOrgs: () => $get('/api/admin/organizations'),
    saveOrg: (payload) => $post('/api/admin/organizations', payload),
    orgDashboard: (orgId) => $get(`/api/admin/organizations/${orgId}/dashboard`),
    orgStudents: (orgId) => $get(`/api/admin/organizations/${orgId}/students`),
    // Skill map
    listPaths: () => $get('/api/admin/career-paths'),
    savePath: (p) => $post('/api/admin/career-paths', p),
    deletePath: (pathId) => $delete(`/api/admin/career-paths/${pathId}`),
    listNodes: (pathId) => $get(`/api/admin/career-paths/${pathId}/nodes`),
    saveNode: (pathId, n) => $post(`/api/admin/career-paths/${pathId}/nodes`, n),
    deleteNode: (nodeId) => $delete(`/api/admin/career-paths/nodes/${nodeId}`),
    // Question bank
    listQuestions: (params) => $get('/api/admin/questions', { params }),
    listPendingReview: () => $get('/api/admin/questions', { params: { reviewStatus: 'PENDING_REVIEW' } }),
    approveQuestion: (id) => $post(`/api/admin/questions/${id}/approve`, {}),
    rejectQuestion: (id) => $post(`/api/admin/questions/${id}/reject`, {}),
    updateQuestion: (id, payload) => $post(`/api/admin/questions/${id}`, payload),
    deleteQuestion: (id) => $delete(`/api/admin/questions/${id}`),
    // Weekly report
    runWeeklyReport: () => $post('/api/admin/weekly-report/run'),
    // Feedback
    listFeedbacks: (params) => $get('/api/admin/feedback', { params }),
    updateFeedbackStatus: (id, status) => $post(`/api/admin/feedback/${id}/status`, { status }),
};
export default http;
