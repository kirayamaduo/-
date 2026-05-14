import request from '@/utils/request';

export interface CdutEmploymentSource {
  id: number;
  year?: number;
  title: string;
  url: string;
  sourceType: string;
  majorKeyword?: string;
  careerKeyword?: string;
  employmentRate?: number;
  postgraduateRate?: number;
  excerpt?: string;
  fetchedAt?: string;
}

export interface CdutEmploymentTrendPoint {
  year?: number;
  employmentRate?: number;
  postgraduateRate?: number;
}

export interface CdutEmploymentInsight {
  school: string;
  major: string;
  targetRole: string;
  matchLabel: string;
  summary: string;
  latestEmploymentRate?: number;
  latestPostgraduateRate?: number;
  latestYear?: number;
  sourceCount: number;
  updatedAt?: string;
  destinationHighlights: string[];
  trend: CdutEmploymentTrendPoint[];
  sources: CdutEmploymentSource[];
}

export const getCdutEmploymentInsightApi = () =>
  request<CdutEmploymentInsight>({
    url: '/api/cdut-employment/insight',
    method: 'GET',
    silent: true,
  });

export const refreshCdutEmploymentInsightApi = () =>
  request<CdutEmploymentInsight>({
    url: '/api/cdut-employment/refresh',
    method: 'POST',
    silent: true,
  });
