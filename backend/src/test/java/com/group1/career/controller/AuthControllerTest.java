package com.group1.career.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group1.career.common.ErrorCode;
import com.group1.career.config.JwtConfig;
import com.group1.career.exception.BizException;
import com.group1.career.interceptor.AuthInterceptor;
import com.group1.career.model.entity.User;
import com.group1.career.service.EmailService;
import com.group1.career.service.UserService;
import com.group1.career.service.VerificationCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Auth contract tests after the Sprint A overhaul:
 *   - identityType is now {@code EMAIL_PASSWORD} (the previous {@code EMAIL}
 *     / {@code MOBILE} buckets were collapsed since we only support email).
 *   - register requires a 6-digit verification code; the test stubs it
 *     accepted via {@link VerificationCodeService#verify}.
 *   - the controller now wires {@link EmailService} +
 *     {@link VerificationCodeService} alongside {@link UserService}; both
 *     are mocked so the WebMvc context loads.
 */
@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
@Import(JwtConfig.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private VerificationCodeService verificationCodeService;

    @MockitoBean
    private AuthInterceptor authInterceptor;

    @Autowired
    private ObjectMapper objectMapper;

    // ===== Register =====

    @Test
    @DisplayName("POST /auth/register — happy path with valid 6-digit code")
    public void testRegister_Success() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("nickname", "Alice");
        request.put("identityType", "EMAIL_PASSWORD");
        request.put("identifier", "alice@example.com");
        request.put("credential", "pass123");
        request.put("code", "123456");

        when(verificationCodeService.verify(anyString(), anyString(), anyString())).thenReturn(true);

        User mockUser = User.builder().userId(1L).nickname("Alice").build();
        when(userService.register(anyString(), anyString(), anyString(), anyString())).thenReturn(mockUser);
        when(userService.hydrateUrl(mockUser)).thenReturn(mockUser);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.userId").value(1))
                .andExpect(jsonPath("$.data.nickname").value("Alice"));
    }

    @Test
    @DisplayName("POST /auth/register — bad code is rejected before user touches DB")
    public void testRegister_BadCode() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("nickname", "Alice");
        request.put("identityType", "EMAIL_PASSWORD");
        request.put("identifier", "alice@example.com");
        request.put("credential", "pass123");
        request.put("code", "999999");

        when(verificationCodeService.verify(anyString(), anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /auth/register — nickname under 2 chars fails Bean Validation")
    public void testRegister_NicknameTooShort() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("nickname", "A");
        request.put("identityType", "EMAIL_PASSWORD");
        request.put("identifier", "alice@example.com");
        request.put("credential", "pass123");
        request.put("code", "123456");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ===== Login =====

    @Test
    @DisplayName("POST /auth/login — returns JWT + user payload")
    public void testLogin_Success() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("identityType", "EMAIL_PASSWORD");
        request.put("identifier", "alice@example.com");
        request.put("credential", "password123");

        User mockUser = User.builder().userId(1L).nickname("Alice").build();
        when(userService.login(anyString(), anyString(), anyString())).thenReturn(mockUser);
        when(userService.hydrateUrl(mockUser)).thenReturn(mockUser);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.userId").value(1));
    }

    @Test
    @DisplayName("POST /auth/login — surfaces user-not-found via biz code")
    public void testLogin_UserNotFound() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("identityType", "EMAIL_PASSWORD");
        request.put("identifier", "nobody@example.com");
        request.put("credential", "wrongpass");

        when(userService.login(anyString(), anyString(), anyString()))
                .thenThrow(new BizException(ErrorCode.USER_NOT_FOUND));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("POST /auth/login — missing credential is a Bean Validation 400")
    public void testLogin_MissingCredential() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("identityType", "EMAIL_PASSWORD");
        request.put("identifier", "test@example.com");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
