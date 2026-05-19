package com.group1.career.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeKeywordDto {
    private String category;
    private String label;
    private Integer weight;
    private String evidence;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Status {
        private Long resumeId;
        private String status;
        private String errorMsg;
        private List<ResumeKeywordDto> keywords;
    }
}
