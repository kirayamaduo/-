package com.group1.career.repository;

import com.group1.career.model.entity.UserProfileTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserProfileTagRepository extends JpaRepository<UserProfileTag, Long> {
    List<UserProfileTag> findByUserIdOrderByCategoryAscWeightDescUpdatedAtDesc(Long userId);
    List<UserProfileTag> findByUserIdAndSource(Long userId, String source);
    Optional<UserProfileTag> findByUserIdAndCategoryAndLabel(Long userId, String category, String label);
    void deleteByUserIdAndSource(Long userId, String source);
}
