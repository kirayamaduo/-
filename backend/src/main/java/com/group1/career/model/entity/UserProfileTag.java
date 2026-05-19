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
@Table(name = "user_profile_tags",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_profile_tag", columnNames = {"user_id", "category", "label"}),
        indexes = @Index(name = "idx_user_profile_tags_user_category", columnList = "user_id, category"))
public class UserProfileTag {

    public static final String CATEGORY_SKILL = "SKILL";
    public static final String CATEGORY_BACKGROUND = "BACKGROUND";
    public static final String CATEGORY_GROWTH = "GROWTH";
    public static final String CATEGORY_GOAL = "GOAL";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long tagId;

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
    private String source = "SYSTEM_INFERRED";

    @Column(name = "evidence", length = 255)
    private String evidence;

    @Column(name = "editable", nullable = false)
    @Builder.Default
    private Boolean editable = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
