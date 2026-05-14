package com.group1.career.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.model.dto.CareerAgentTodayDto;
import com.group1.career.model.dto.UserProfileSnapshot;
import com.group1.career.model.entity.AgentTask;
import com.group1.career.repository.AgentTaskRepository;
import com.group1.career.repository.UserRepository;
import com.group1.career.service.impl.CareerAgentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CareerAgentServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserProfileSnapshotService snapshotService;
    @Mock
    private CheckInService checkInService;
    @Mock
    private AgentTaskRepository taskRepository;
    @Mock
    private CareerPlanService careerPlanService;
    @Mock
    private AgentEventService agentEventService;
    @Mock
    private AgentStateService agentStateService;
    @Mock
    private AgentProfileService agentProfileService;
    @Mock
    private AgentReasonService agentReasonService;

    private CareerAgentServiceImpl service;

    @BeforeEach
    public void setUp() {
        service = new CareerAgentServiceImpl(
                userRepository,
                snapshotService,
                checkInService,
                taskRepository,
                careerPlanService,
                agentEventService,
                agentStateService,
                agentProfileService,
                agentReasonService,
                new ObjectMapper()
        );
        when(checkInService.getStatus(1L)).thenReturn(CheckInService.CheckInStatus.empty());
        when(careerPlanService.getCurrent(1L)).thenReturn(Optional.empty());
        when(taskRepository.countDismissedByTaskTypeSince(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(taskRepository.findByUserIdAndDueDateAndTaskKey(eq(1L), any(LocalDate.class), anyString()))
                .thenReturn(Optional.empty());
        when(taskRepository.save(any(AgentTask.class))).thenAnswer(inv -> inv.getArgument(0));
        when(taskRepository.findByUserIdAndDueDateOrderByCreatedAtDesc(eq(1L), any(LocalDate.class)))
                .thenReturn(List.of());
        when(agentReasonService.reason(any(), anyString(), anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(3));
    }

    @Test
    @DisplayName("getToday — internship seeker without resume gets resume-material bootstrap task")
    public void testGetToday_InternshipNoResume() {
        when(snapshotService.read(1L)).thenReturn(snapshot("internship_seeker", "no", "前端开发实习生"));

        CareerAgentTodayDto today = service.getToday(1L);

        assertEquals("INTERNSHIP_RESUME_BOOTSTRAP", today.getStage());
        assertEquals("建立第一版实习简历素材", today.getHeadline());
        assertEquals("整理实习简历素材", today.getActions().get(0).getLabel());
        assertTrue(today.getRiskReasons().contains("实习简历素材尚未建立"));
        verify(agentStateService).refresh(1L, "INTERNSHIP_RESUME_BOOTSTRAP", null, "前端开发实习生", null);
    }

    @Test
    @DisplayName("getToday — new graduate with self-reported resume but no system resume asks for upload and JD match")
    public void testGetToday_NewGraduateSelfReportedResume() {
        when(snapshotService.read(1L)).thenReturn(snapshot("new_graduate", "yes", "Java 开发工程师"));

        CareerAgentTodayDto today = service.getToday(1L);

        assertEquals("GRADUATE_RESUME_UPLOAD", today.getStage());
        assertEquals("上传简历并匹配一个目标 JD", today.getHeadline());
        assertEquals("上传简历做 JD 匹配", today.getActions().get(0).getLabel());
        assertTrue(today.getReason().contains("已有简历"));
        verify(agentStateService).refresh(1L, "GRADUATE_RESUME_UPLOAD", null, "Java 开发工程师", null);
    }

    @Test
    @DisplayName("getToday — career switcher gets transition-positioning task before generic gaps")
    public void testGetToday_CareerSwitcher() {
        when(snapshotService.read(1L)).thenReturn(snapshot("career_switcher", "yes", "产品经理"));

        CareerAgentTodayDto today = service.getToday(1L);

        assertEquals("CAREER_SWITCH_POSITIONING", today.getStage());
        assertEquals("整理转岗理由和目标岗位证据", today.getHeadline());
        assertEquals("整理转岗证据", today.getActions().get(0).getLabel());
        assertTrue(today.getTodayFocus().contains("产品经理"));
        verify(agentStateService).refresh(1L, "CAREER_SWITCH_POSITIONING", null, "产品经理", null);
    }

    private UserProfileSnapshot snapshot(String identityType, String hasResume, String targetRole) {
        return UserProfileSnapshot.builder()
                .onboarding(UserProfileSnapshot.OnboardingBlock.builder()
                        .identityType(identityType)
                        .hasResume(hasResume)
                        .onboardingCompletedAt("2026-05-14T10:00:00.000Z")
                        .build())
                .preferences(UserProfileSnapshot.PreferencesBlock.builder()
                        .targetRole(targetRole)
                        .build())
                .build();
    }
}
