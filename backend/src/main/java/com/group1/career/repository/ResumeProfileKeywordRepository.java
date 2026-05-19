package com.group1.career.repository;

import com.group1.career.model.entity.ResumeProfileKeyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeProfileKeywordRepository extends JpaRepository<ResumeProfileKeyword, Long> {
    List<ResumeProfileKeyword> findByResumeIdOrderByWeightDescUpdatedAtDesc(Long resumeId);
    List<ResumeProfileKeyword> findByResumeIdAndStatusOrderByWeightDescUpdatedAtDesc(Long resumeId, String status);
    List<ResumeProfileKeyword> findByUserIdAndStatusOrderByCategoryAscWeightDescUpdatedAtDesc(Long userId, String status);
    boolean existsByResumeId(Long resumeId);
    boolean existsByResumeIdAndStatusIn(Long resumeId, List<String> statuses);
    void deleteByResumeId(Long resumeId);
}
