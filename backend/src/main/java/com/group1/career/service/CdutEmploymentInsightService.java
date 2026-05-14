package com.group1.career.service;

import com.group1.career.model.dto.CdutEmploymentInsightDto;

public interface CdutEmploymentInsightService {
    CdutEmploymentInsightDto getInsightForCurrentUser();

    CdutEmploymentInsightDto refreshForCurrentUser();
}
