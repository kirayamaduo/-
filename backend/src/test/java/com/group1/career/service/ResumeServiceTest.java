package com.group1.career.service;

import com.group1.career.model.entity.Resume;
import com.group1.career.repository.ResumeRepository;
import com.group1.career.service.impl.ResumeServiceImpl;
import com.group1.career.service.FileService;
import com.group1.career.service.UserProfileSnapshotService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ResumeServiceTest {

    @Mock
    private ResumeRepository resumeRepository;

    /** Only used by hydrateUrl / downloadBytes paths, none exercised here. */
    @Mock
    private FileService fileService;

    /** Best-effort cross-tool portrait merge wrapped in try/catch in the impl;
     *  a no-op mock keeps the test focused on the resume CRUD shape. */
    @Mock
    private UserProfileSnapshotService snapshotService;

    @InjectMocks
    private ResumeServiceImpl resumeService;

    @Test
    @DisplayName("Test Create Resume")
    public void testCreateResume_Success() {
        Long userId = 100L;
        String title = "Java Resume";
        String parsedContent = "{\"skills\":[\"Java\",\"Spring\"]}";

        Resume savedResume = Resume.builder().resumeId(1L).userId(userId).title(title)
                .parsedContent(parsedContent).build();
        when(resumeRepository.save(any(Resume.class))).thenReturn(savedResume);

        Resume result = resumeService.createResume(userId, title, "Dev", "url", parsedContent);

        assertNotNull(result);
        assertEquals(1L, result.getResumeId());
        assertEquals(parsedContent, result.getParsedContent());
        verify(resumeRepository, times(1)).save(any(Resume.class));
    }

    @Test
    @DisplayName("Test Get Resume by ID")
    public void testGetResume_Success() {
        Long resumeId = 1L;
        Resume mockResume = Resume.builder().resumeId(resumeId).title("My Resume").build();
        when(resumeRepository.findById(resumeId)).thenReturn(Optional.of(mockResume));

        Resume result = resumeService.getResumeBasic(resumeId);
        assertNotNull(result);
        assertEquals("My Resume", result.getTitle());
    }

    @Test
    @DisplayName("Test Get User Resumes List")
    public void testGetUserResumes_Success() {
        Long userId = 50L;
        List<Resume> mockList = List.of(
                Resume.builder().resumeId(1L).title("Resume A").build(),
                Resume.builder().resumeId(2L).title("Resume B").build()
        );

        when(resumeRepository.findByUserId(userId)).thenReturn(mockList);

        List<Resume> result = resumeService.getUserResumes(userId);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Resume A", result.get(0).getTitle());
        verify(resumeRepository, times(1)).findByUserId(userId);
    }

    @Test
    @DisplayName("Delete resume clears snapshot when no resumes remain")
    public void testDeleteResume_ClearsSnapshotWhenEmpty() {
        Long userId = 10L;
        Long resumeId = 5L;
        Resume existing = Resume.builder().resumeId(resumeId).userId(userId).fileUrl("resumes/a.pdf").build();
        when(resumeRepository.findById(resumeId)).thenReturn(Optional.of(existing));
        when(resumeRepository.findByUserId(userId)).thenReturn(List.of());

        resumeService.deleteResume(resumeId);

        verify(resumeRepository).deleteById(resumeId);
        verify(snapshotService).clearResume(userId);
    }
}
