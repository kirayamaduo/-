package com.group1.career.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CdutEmploymentInsightDto {
    private String school;
    private String major;
    private String targetRole;
    private String matchLabel;
    private String summary;
    private BigDecimal latestEmploymentRate;
    private BigDecimal latestPostgraduateRate;
    private Integer latestYear;
    private Integer sourceCount;
    private LocalDateTime updatedAt;
    private Boolean demoMode;
    private List<String> destinationHighlights;
    private List<YearPoint> trend;
    private List<CoverageItem> coverage;
    private List<SourceItem> sources;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YearPoint {
        private Integer year;
        private BigDecimal employmentRate;
        private BigDecimal postgraduateRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceItem {
        private Long id;
        private Integer year;
        private String title;
        private String url;
        private String sourceType;
        private String majorKeyword;
        private String careerKeyword;
        private BigDecimal employmentRate;
        private BigDecimal postgraduateRate;
        private String excerpt;
        private LocalDateTime fetchedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CoverageItem {
        private String school;
        private Integer year;
        /** VERIFIED_FULL | PARTIAL | MISSING | NEEDS_MANUAL_REVIEW */
        private String status;
        private String label;
        private String reason;
        private String sourceUrl;
    }
}
