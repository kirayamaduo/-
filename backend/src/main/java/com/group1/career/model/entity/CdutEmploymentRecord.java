package com.group1.career.model.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "cdut_employment_records", indexes = {
        @Index(name = "idx_cdut_employment_year", columnList = "source_year"),
        @Index(name = "idx_cdut_employment_major", columnList = "major_keyword"),
        @Index(name = "idx_cdut_employment_career", columnList = "career_keyword")
})
public class CdutEmploymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "source_year")
    private Integer year;

    @Column(name = "source_title", nullable = false, length = 255)
    private String sourceTitle;

    @Column(name = "source_url", nullable = false, length = 768, unique = true)
    private String sourceUrl;

    @Column(name = "source_type", nullable = false, length = 40)
    @Builder.Default
    private String sourceType = "PUBLIC_WEB";

    @Column(name = "major_keyword", length = 120)
    private String majorKeyword;

    @Column(name = "career_keyword", length = 120)
    private String careerKeyword;

    @Column(name = "employment_rate", precision = 5, scale = 2)
    private BigDecimal employmentRate;

    @Column(name = "postgraduate_rate", precision = 5, scale = 2)
    private BigDecimal postgraduateRate;

    @Column(name = "destination_summary", length = 1200)
    private String destinationSummary;

    @Column(name = "raw_excerpt", columnDefinition = "text")
    private String rawExcerpt;

    @Column(name = "fetched_at", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fetchedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
