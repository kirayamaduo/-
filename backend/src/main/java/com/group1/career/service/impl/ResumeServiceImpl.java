package com.group1.career.service.impl;

import com.group1.career.common.ErrorCode;
import com.group1.career.exception.BizException;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.entity.Resume;
import com.group1.career.repository.ResumeRepository;
import com.group1.career.service.FileService;
import com.group1.career.service.ResumeService;
import com.group1.career.service.UserProfileSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {

    /** Resume previews are usually opened, scrolled, then closed quickly. */
    private static final long PREVIEW_TTL_SECONDS = 15 * 60;

    private final ResumeRepository resumeRepository;
    private final FileService fileService;
    private final UserProfileSnapshotService snapshotService;

    @Override
    @Transactional
    public Resume createResume(Long userId, String title, String targetJob, String fileUrl, String parsedContent) {
        Resume resume = Resume.builder()
                .userId(userId)
                .title(title)
                .targetJob(targetJob)
                .fileUrl(fileUrl)
                .parsedContent(parsedContent)
                .build();
        Resume saved = resumeRepository.save(resume);
        mergeIntoSnapshot(saved);
        return saved;
    }

    @Override
    public Resume getResumeBasic(Long resumeId) {
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new BizException(ErrorCode.RESUME_NOT_FOUND));
    }

    @Override
    public List<Resume> getUserResumes(Long userId) {
        return resumeRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteResume(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new BizException(ErrorCode.RESUME_NOT_FOUND));
        resumeRepository.deleteById(resumeId);
        // Best-effort: clean up the OSS object so we don't accumulate orphan
        // PDFs after a delete. deleteObject swallows OSS exceptions itself,
        // so a transient OSS hiccup never rolls back the DB delete.
        if (resume.getFileUrl() != null && !resume.getFileUrl().isBlank()) {
            fileService.deleteObject(resume.getFileUrl());
        }
        syncResumeSnapshotFromDb(resume.getUserId());
        log.info("Deleted resume: {}", resumeId);
    }

    @Override
    @Transactional
    public Resume updateResume(Resume resume) {
        Resume saved = resumeRepository.save(resume);
        mergeIntoSnapshot(saved);
        return saved;
    }

    /**
     * Push the latest resume into the user's cross-tool portrait so the
     * interview start page / AI assistant can default to "your latest
     * resume" without an extra round-trip. Best-effort only.
     */
    private void mergeIntoSnapshot(Resume resume) {
        if (resume == null || resume.getUserId() == null) return;
        try {
            snapshotService.mergeResume(resume.getUserId(), UserProfileSnapshot.ResumeBlock.builder()
                    .lastResumeId(resume.getResumeId())
                    .lastResumeKey(resume.getFileUrl())
                    .title(resume.getTitle())
                    .targetJob(resume.getTargetJob())
                    .diagnosisScore(resume.getDiagnosisScore())
                    .updatedAt(resume.getUpdatedAt() != null ? resume.getUpdatedAt() : LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("[resume] snapshot merge failed for resume {}: {}", resume.getResumeId(), e.toString());
        }
    }

    /**
     * After delete, re-point the portrait at the newest remaining resume or clear it.
     * Prevents the home "最近简历" row from showing a ghost entry.
     */
    private void syncResumeSnapshotFromDb(Long userId) {
        if (userId == null) return;
        List<Resume> remaining = resumeRepository.findByUserId(userId);
        if (remaining.isEmpty()) {
            snapshotService.clearResume(userId);
            return;
        }
        Resume latest = remaining.stream()
                .max(Comparator.comparing(
                        (Resume r) -> r.getUpdatedAt() != null ? r.getUpdatedAt() : r.getCreatedAt(),
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(remaining.get(0));
        mergeIntoSnapshot(latest);
    }

    @Override
    public Resume assertOwnership(Long resumeId, Long userId) {
        if (resumeId == null || userId == null) {
            throw new BizException(ErrorCode.UNAUTHORIZED_ERROR);
        }
        Resume r = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new BizException(ErrorCode.RESUME_NOT_FOUND));
        if (!userId.equals(r.getUserId())) {
            log.warn("Ownership violation: user {} tried to access resume {} owned by {}",
                    userId, resumeId, r.getUserId());
            throw new BizException(ErrorCode.FORBIDDEN);
        }
        return r;
    }

    @Override
    public Resume hydrateUrl(Resume resume) {
        if (resume == null) return null;
        String key = resume.getFileUrl();
        if (key != null && !key.isBlank()) {
            // presignedUrl tolerates either a bare key or a legacy full URL,
            // so this still works for any rows that pre-date the URL→key cut-over.
            resume.setFileViewUrl(fileService.presignedUrl(key, PREVIEW_TTL_SECONDS));
        }
        return resume;
    }

    @Override
    public List<Resume> hydrateUrls(List<Resume> resumes) {
        if (resumes == null || resumes.isEmpty()) return Collections.emptyList();
        resumes.forEach(this::hydrateUrl);
        return resumes;
    }
}
