package com.group1.career.service;

import com.group1.career.model.dto.ResumeKeywordDto;

public interface ResumeKeywordService {
    ResumeKeywordDto.Status getStatus(Long userId, Long resumeId);
    ResumeKeywordDto.Status triggerExtraction(Long userId, Long resumeId, boolean force);
    void extractAsync(Long userId, Long resumeId, boolean force);
}
