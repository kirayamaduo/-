import request, { uploadFileRequest } from '@/utils/request';

export interface Interview {
  interviewId?: number;
  userId: number;
  resumeId?: number;
  positionName: string;
  difficulty: string; // 'Easy', 'Normal', 'Hard'
  status?: string;    // 'ONGOING', 'COMPLETED', 'CANCELLED'
  /** Modality the candidate started with — drives history resume routing. */
  mode?: 'TEXT' | 'VOICE';
  finalScore?: number;
  reportMongoId?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface InterviewMessage {
  msgId?: number;
  interviewId: number;
  role: string; // 'USER', 'AI'
  content: string;
  createdAt?: string;
}

export interface MessageResponse {
  userMessage: string;
  aiMessage: string;
}

/**
 * Start a new interview
 */
export const startInterviewApi = (data: {
  // userId is resolved server-side from the JWT; do not send it.
  resumeId?: number;
  positionName: string;
  difficulty: string;
  /** TEXT (default) or VOICE — must match what the start page picked. */
  mode?: 'TEXT' | 'VOICE';
}) => {
  return request<Interview>({
    url: '/api/interviews/start',
    method: 'POST',
    data,
  });
};

/**
 * Send message in interview (get AI response)
 */
export const sendInterviewMessageApi = (interviewId: number, content: string, language = 'zh') => {
  return request<MessageResponse>({
    url: `/api/interviews/${interviewId}/message`,
    method: 'POST',
    data: { content, language },
  });
};

/**
 * Get interview message history
 */
export const getInterviewMessagesApi = (interviewId: number) => {
  return request<InterviewMessage[]>({
    url: `/api/interviews/${interviewId}/messages`,
    method: 'GET',
  });
};

/**
 * End interview. The final score is no longer client-supplied — it is
 * produced by the AI report endpoint based on the full transcript.
 */
export const endInterviewApi = (interviewId: number) => {
  return request<Interview>({
    url: `/api/interviews/${interviewId}/end`,
    method: 'POST',
  });
};

/**
 * Trigger the AI interviewer's opening question. Idempotent: returns the
 * existing first message if the conversation is non-empty.
 */
export const generateGreetingApi = (interviewId: number, language = 'zh') => {
  return request<InterviewMessage>({
    url: `/api/interviews/${interviewId}/greeting`,
    method: 'POST',
    params: { language },
  });
};

// ============================== Voice (Digital Human) ==============================

/**
 * Voice turn payload returned by both `voice-greeting` and `voice-turn`.
 *
 * `userText` is null for the greeting call (no candidate input yet); on the
 * answer-reply path it carries the Paraformer transcript so the UI can
 * confirm what we heard.
 *
 * `audioUrl` is a 30-min presigned OSS URL — pop it straight into
 * `<audio src="...">`. If the player still hasn't played 30 min later, ask
 * the backend for the same `audioKey` again with a fresh sign.
 *
 * `durationMs` is a coarse estimate the backend computes from byte count;
 * the player should overwrite it with the real duration once
 * `loadedmetadata` fires. It's there so the lip-sync animation can start
 * immediately even if the device is slow to load audio metadata.
 */
export interface VoiceTurnResponse {
  userText?: string;
  aiText: string;
  audioKey: string;
  audioUrl: string;
  durationMs: number;
}

/**
 * Generate (or fetch the cached text of) the AI interviewer's opening
 * question and return a freshly synthesized audio URL. Safe to call on
 * every entry to room.vue.
 */
export const voiceGreetingApi = (interviewId: number, language = 'zh') => {
  return request<VoiceTurnResponse>({
    url: `/api/interviews/${interviewId}/voice-greeting`,
    method: 'POST',
    params: { language },
  });
};

/**
 * Upload the candidate's recorded answer (mp3, 16 kHz, mono) and receive:
 *   - the Paraformer transcript of what they said
 *   - the AI interviewer's next-question text
 *   - a presigned URL playing back the AI's spoken next-question
 *
 * This is wired through `uni.uploadFile` (not the JSON axios layer) because
 * the WeChat mini-program multipart support is on `uni.uploadFile` only.
 */
export const voiceTurnApi = (
  interviewId: number,
  filePath: string,
  format: 'mp3' | 'aac' | 'wav' = 'mp3',
  language = 'zh'
): Promise<VoiceTurnResponse> => {
  return uploadFileRequest<VoiceTurnResponse>({
    url: `/api/interviews/${interviewId}/voice-turn`,
    filePath,
    name: 'audio',
    formData: { format, language },
  });
};

// ============================== Report ==============================

export interface RadarChartData {
  expression: number;
  logic: number;
  technical: number;
  pressureResistance: number;
  communication: number;
  /** Sprint C-1 — composite of eye contact + facial expression + posture.
   *  Null when the candidate took the text path (no camera frames). */
  bodyLanguage?: number | null;
}

export interface AdviceItem {
  title: string;
  detail: string;
}

export interface InterviewReport {
  interviewId: number;
  positionName: string;
  difficulty: string;
  mode?: 'TEXT' | 'VOICE' | string;
  durationSeconds?: number;
  overallScore: number;
  totalQuestions: number;
  radarChart: RadarChartData;
  bodyLanguageAnalysis?: {
    eyeContact: number;
    expression: number;
    posture: number;
    bodyLanguage: number;
    averageConfidence: number;
    frames: number;
    summary: string;
  };
  strengths: AdviceItem[];
  improvements: AdviceItem[];
  textSummary: string;
}

/**
 * Fetch (or generate) the AI evaluation report for an interview.
 * First call triggers a real AI evaluation (~10-20s); subsequent
 * calls hit the cached JSON on the interview row.
 */
export const getInterviewReportApi = (interviewId: number) => {
  return request<InterviewReport>({
    url: `/api/interviews/report/${interviewId}`,
    method: 'GET',
  });
};

/**
 * Get user's all interviews
 */
export const getUserInterviewsApi = (userId: number) => {
  return request<Interview[]>({
    url: `/api/interviews/user/${userId}`,
    method: 'GET',
  });
};

/**
 * Get interview by ID
 */
export const getInterviewByIdApi = (interviewId: number) => {
  return request<Interview>({
    url: `/api/interviews/${interviewId}`,
    method: 'GET',
  });
};

export const deleteInterviewApi = (interviewId: number) => {
  return request<string>({
    url: `/api/interviews/${interviewId}`,
    method: 'DELETE',
  });
};

