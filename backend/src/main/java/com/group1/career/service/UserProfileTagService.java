package com.group1.career.service;

import com.group1.career.model.dto.UserProfileTagDto;

import java.util.List;

public interface UserProfileTagService {
    UserProfileTagDto.Summary getSummary(Long userId);
    UserProfileTagDto.Summary refreshFromSignals(Long userId);
    List<UserProfileTagDto> extractResumeKeywords(Long userId, Long resumeId);
    UserProfileTagDto.Summary saveManualTags(Long userId, List<UserProfileTagDto> tags);
    String renderForPrompt(Long userId);
}
