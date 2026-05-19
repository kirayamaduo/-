package com.group1.career.controller;

import com.group1.career.common.Result;
import com.group1.career.model.dto.ResumeKeywordDto;
import com.group1.career.model.dto.UserProfileTagDto;
import com.group1.career.service.ResumeKeywordService;
import com.group1.career.service.UserProfileTagService;
import com.group1.career.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User Profile Tags API", description = "Editable structured career portrait tags")
@RestController
@RequestMapping("/api/profile-tags")
@RequiredArgsConstructor
public class UserProfileTagController {

    private final UserProfileTagService tagService;
    private final ResumeKeywordService resumeKeywordService;

    @Operation(summary = "Get current user's structured profile tags")
    @GetMapping
    public Result<UserProfileTagDto.Summary> getTags() {
        Long userId = SecurityUtil.requireCurrentUserId();
        return Result.success(tagService.refreshFromSignals(userId));
    }

    @Operation(summary = "Refresh inferred tags from existing user signals")
    @PostMapping("/refresh")
    public Result<UserProfileTagDto.Summary> refresh() {
        Long userId = SecurityUtil.requireCurrentUserId();
        return Result.success(tagService.refreshFromSignals(userId));
    }

    @Operation(summary = "Extract and persist profile keywords from one resume")
    @PostMapping("/resume/{resumeId}/keywords")
    public Result<java.util.List<UserProfileTagDto>> extractResumeKeywords(@PathVariable Long resumeId) {
        Long userId = SecurityUtil.requireCurrentUserId();
        resumeKeywordService.triggerExtraction(userId, resumeId, false);
        return Result.success(tagService.extractResumeKeywords(userId, resumeId));
    }

    @Operation(summary = "Start cached keyword extraction for one resume")
    @PostMapping("/resume/{resumeId}/keywords/status")
    public Result<ResumeKeywordDto.Status> startResumeKeywordExtraction(
            @PathVariable Long resumeId,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        Long userId = SecurityUtil.requireCurrentUserId();
        return Result.success(resumeKeywordService.triggerExtraction(userId, resumeId, force));
    }

    @Operation(summary = "Read cached keyword extraction status for one resume")
    @GetMapping("/resume/{resumeId}/keywords/status")
    public Result<ResumeKeywordDto.Status> getResumeKeywordStatus(@PathVariable Long resumeId) {
        Long userId = SecurityUtil.requireCurrentUserId();
        return Result.success(resumeKeywordService.getStatus(userId, resumeId));
    }

    @Operation(summary = "Replace user-edited tags")
    @PutMapping("/manual")
    public Result<UserProfileTagDto.Summary> saveManual(@RequestBody UserProfileTagDto.ManualSaveRequest request) {
        Long userId = SecurityUtil.requireCurrentUserId();
        return Result.success(tagService.saveManualTags(userId, request == null ? null : request.getTags()));
    }
}
