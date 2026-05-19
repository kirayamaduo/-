package com.group1.career.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileTagDto {
    private Long tagId;
    private String category;
    private String label;
    private Integer weight;
    private String source;
    private String evidence;
    private Boolean editable;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private List<UserProfileTagDto> tags;
        private Map<String, List<UserProfileTagDto>> sections;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualSaveRequest {
        private List<UserProfileTagDto> tags;
    }
}
