package com.group1.career.model.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "resume_profile_keywords",
        uniqueConstraints = @UniqueConstraint(name = "uk_resume_profile_keyword", columnNames = {"resume_id", "category", "label"}),
        indexes = {
                @Index(name = "idx_resume_profile_keywords_resume", columnList = "resume_id, status"),
                @Index(name = "idx_resume_profile_keywords_user", columnList = "user_id, category, weight")
        })
public class ResumeProfileKeyword {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_READY = "READY";
    public static final String STATUS_EMPTY = "EMPTY";
    public static final String STATUS_FAILED = "FAILED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resume_id", nullable = false)
    private Long resumeId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category", nullable = false, length = 32)
    private String category;

    @Column(name = "label", nullable = false, length = 120)
    private String label;

    @Column(name = "weight", nullable = false)
    @Builder.Default
    private Integer weight = 50;

    @Column(name = "source", nullable = false, length = 32)
    @Builder.Default
    private String source = "RESUME";

    @Column(name = "evidence", length = 255)
    private String evidence;

    @Column(name = "status", nullable = false, length = 24)
    @Builder.Default
    private String status = STATUS_READY;

    @Column(name = "error_msg", length = 255)
    private String errorMsg;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
