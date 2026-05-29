import request, { uploadFileRequest } from '@/utils/request';

/**
 * Resume Detail Interface (Stored in MongoDB)
 */
export interface ResumeDetail {
  skills: string[];
  education?: any[];
  projects?: any[];
  rawContent?: string;
}

/**
 * Resume Interface (Main Entity in MySQL)
 *
 * `fileUrl` is now an OSS object key (e.g. `resumes/uuid.pdf`); never feed it
 * directly to <image>/<a>. Use `fileViewUrl` (a short-lived presigned URL the
 * backend hydrates on every read) for previews and downloads.
 */
export interface Resume {
  resumeId?: number;
  userId: number;
  title: string;
  targetJob: string;
  /** OSS object key (e.g. `resumes/uuid.pdf`). Not directly loadable. */
  fileUrl: string;
  /** Short-lived signed URL — present on responses, never sent on requests. */
  fileViewUrl?: string;
  status?: string;
  detail?: ResumeDetail;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Resume API
 * @param data Resume Data
 */
export const createResumeApi = (data: Resume) => {
  return request<Resume>({
    url: '/api/resumes',
    method: 'POST',
    data,
  });
};

/**
 * Get Resume API
 * @param resumeId Resume ID
 */
export const getResumeApi = (resumeId: number) => {
  return request<Resume>({
    url: `/api/resumes/${resumeId}`,
    method: 'GET',
  });
};

/**
 * List resumes for the JWT-authenticated user (preferred — avoids stale local userId).
 */
export const getMyResumesApi = () => {
  return request<Resume[]>({
    url: '/api/resumes/me',
    method: 'GET',
  });
};

/**
 * Get User Resumes API
 * @param userId User ID (must match JWT subject)
 */
export const getUserResumesApi = (userId: number) => {
  return request<Resume[]>({
    url: `/api/resumes/user/${userId}`,
    method: 'GET',
  });
};

/**
 * Delete Resume API
 */
export const deleteResumeApi = (resumeId: number) => {
  return request<void>({
    url: `/api/resumes/${resumeId}`,
    method: 'DELETE',
  });
};

/**
 * Update Resume API (rename / change targetJob etc.)
 */
export const updateResumeApi = (resumeId: number, data: Partial<Resume>) => {
  return request<Resume>({
    url: `/api/resumes/${resumeId}`,
    method: 'PUT',
    data,
  });
};

/**
 * Resume Diagnosis: send a resumeId (server pulls fileUrl from OSS) + JD,
 * get a structured AI analysis back (real Aliyun Qwen call).
 */
export interface DiagnosisResult {
  resumeId?: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  rawAnalysis?: string;
}

export const diagnoseResumeApi = (data: {
  resumeId?: number;
  resumeText?: string;
  jobDescription: string;
}) => {
  // silent:true — AI 分析耗时长，后端偶发的 Transaction/System 错误由页面 catch 统一处理
  // 避免 request.ts 在 toast 里直接暴露原始 Java 堆栈信息
  return request<DiagnosisResult>({
    url: '/api/resume-diagnosis/analyze',
    method: 'POST',
    data,
    silent: true,
  });
};

/**
 * Generate a brand-new resume from structured form data (AI -> PDF -> OSS).
 */
export const generateResumeFromTemplateApi = (data: Record<string, any>) => {
  return request<Resume>({
    url: '/api/resume-gen/from-template',
    method: 'POST',
    data,
  });
};

export interface TailorResumeResponse {
  resume: Resume;
  changeItems: string[];
  changeSummary?: string;
}

/**
 * Tailor an existing resume against a target Job Description.
 */
export const tailorResumeApi = (data: { userId: number; resumeId: number; jobDescription: string }) => {
  return request<TailorResumeResponse>({
    url: '/api/resume-gen/tailor',
    method: 'POST',
    data,
    silent: true,
  });
};

/**
 * Upload a PDF resume file directly to backend (which forwards to Aliyun OSS).
 * Resolves with the OSS object key (e.g. `resumes/uuid.pdf`) — store this in
 * `Resume.fileUrl`. Use the entity's `fileViewUrl` for browser display.
 */
export const uploadResumeFile = (filePath: string, folder: string = 'resumes'): Promise<string> => {
  return uploadFileRequest<string>({
    url: '/api/files/upload',
    filePath,
    name: 'file',
    formData: { folder },
  });
};

