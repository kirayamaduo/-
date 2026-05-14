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

    long countByFetchedAtAfter(LocalDateTime cutoff);
}
