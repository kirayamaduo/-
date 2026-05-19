import request from '@/utils/request';

export type ProfileTagCategory = 'SKILL' | 'BACKGROUND' | 'GROWTH' | 'GOAL';

export interface UserProfileTag {
  tagId?: number;
  category: ProfileTagCategory | string;
  label: string;
  weight: number;
  source?: string;
  evidence?: string;
  editable?: boolean;
}

export interface UserProfileTagSummary {
  tags: UserProfileTag[];
  sections: Record<string, UserProfileTag[]>;
}

export type ResumeKeywordStatusValue = 'PENDING' | 'PROCESSING' | 'READY' | 'EMPTY' | 'FAILED' | string;

export interface ResumeKeywordStatus {
  resumeId: number;
  status: ResumeKeywordStatusValue;
  errorMsg?: string;
  keywords: UserProfileTag[];
}

export const getProfileTagsApi = () =>
  request<UserProfileTagSummary>({ url: '/api/profile-tags', method: 'GET', silent: true });

export const refreshProfileTagsApi = () =>
  request<UserProfileTagSummary>({ url: '/api/profile-tags/refresh', method: 'POST', silent: true });

export const extractResumeKeywordsApi = (resumeId: number) =>
  request<UserProfileTag[]>({ url: `/api/profile-tags/resume/${resumeId}/keywords`, method: 'POST', silent: true });

export const startResumeKeywordExtractionApi = (resumeId: number, force = false) =>
  request<ResumeKeywordStatus>({
    url: `/api/profile-tags/resume/${resumeId}/keywords/status`,
    method: 'POST',
    params: force ? { force: true } : undefined,
    silent: true,
  });

export const getResumeKeywordStatusApi = (resumeId: number) =>
  request<ResumeKeywordStatus>({
    url: `/api/profile-tags/resume/${resumeId}/keywords/status`,
    method: 'GET',
    silent: true,
  });

export const saveManualProfileTagsApi = (tags: UserProfileTag[]) =>
  request<UserProfileTagSummary>({ url: '/api/profile-tags/manual', method: 'PUT', data: { tags } });
