package com.group1.career.controller;

import com.group1.career.common.Result;
import com.group1.career.model.dto.CdutEmploymentInsightDto;
import com.group1.career.service.CdutEmploymentInsightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "CDUT Employment Insight API")
@RestController
@RequestMapping("/api/cdut-employment")
@RequiredArgsConstructor
public class CdutEmploymentInsightController {

    private final CdutEmploymentInsightService insightService;

    @Operation(summary = "Get CDUT employment insight matched to current user's major and target role")
    @GetMapping("/insight")
    public Result<CdutEmploymentInsightDto> getInsight() {
        return Result.success(insightService.getInsightForCurrentUser());
    }

    @Operation(summary = "Refresh public CDUT employment sources, then return matched insight")
    @PostMapping("/refresh")
    public Result<CdutEmploymentInsightDto> refresh() {
        return Result.success(insightService.refreshForCurrentUser());
    }
}
