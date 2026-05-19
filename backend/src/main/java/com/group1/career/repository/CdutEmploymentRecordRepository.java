package com.group1.career.repository;

import com.group1.career.model.entity.CdutEmploymentRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CdutEmploymentRecordRepository extends JpaRepository<CdutEmploymentRecord, Long> {
    Optional<CdutEmploymentRecord> findBySourceUrl(String sourceUrl);

    List<CdutEmploymentRecord> findAllByOrderByYearDescFetchedAtDesc(Pageable pageable);

    /**
     * Per-school lookup used by the multi-school insight service so a 西南交通大学
     * student does not get 成都理工大学 numbers mixed into their dashboard.
     */
    List<CdutEmploymentRecord> findBySchoolOrderByYearDescFetchedAtDesc(String school, Pageable pageable);

    List<CdutEmploymentRecord> findBySchoolInAndYearIn(List<String> schools, List<Integer> years);

    long countByFetchedAtAfter(LocalDateTime cutoff);

    long countBySchool(String school);

    long countBySchoolAndFetchedAtAfter(String school, LocalDateTime cutoff);
}
