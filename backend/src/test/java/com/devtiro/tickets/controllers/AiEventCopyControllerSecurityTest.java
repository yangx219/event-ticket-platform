package com.devtiro.tickets.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devtiro.tickets.config.JwtAuthenticationConverter;
import com.devtiro.tickets.config.SecurityConfig;
import com.devtiro.tickets.domain.dtos.GenerateEventCopyResponseDto;
import com.devtiro.tickets.filters.UserProvisioningFilter;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.EventCopyService;
import com.devtiro.tickets.services.AiRequestRateLimiter;
import com.devtiro.tickets.exceptions.AiRateLimitException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AiEventCopyController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, UserProvisioningFilter.class})
class AiEventCopyControllerSecurityTest {

  @Autowired private MockMvc mockMvc;
  @MockitoBean private EventCopyService eventCopyService;
  @MockitoBean private AiRequestRateLimiter rateLimiter;
  @MockitoBean private UserRepository userRepository;
  @MockitoBean private JwtAuthenticationConverter jwtAuthenticationConverter;
  @MockitoBean private JwtDecoder jwtDecoder;

  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    when(userRepository.existsById(userId)).thenReturn(true);
  }

  @Test
  void rejectsAnonymousUsers() throws Exception {
    mockMvc.perform(post("/api/v1/ai/event-copy")
            .contentType(MediaType.APPLICATION_JSON).content(validRequest()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void rejectsUsersWithoutOrganizerRole() throws Exception {
    mockMvc.perform(post("/api/v1/ai/event-copy").with(jwtFor("ROLE_ATTENDEE"))
            .contentType(MediaType.APPLICATION_JSON).content(validRequest()))
        .andExpect(status().isForbidden());
  }

  @Test
  void validatesBlankBriefBeforeCallingModel() throws Exception {
    mockMvc.perform(post("/api/v1/ai/event-copy").with(jwtFor("ROLE_ORGANIZER"))
            .contentType(MediaType.APPLICATION_JSON).content("{\"brief\":\"   \"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("brief: Describe the event you want to create"));
  }

  @Test
  void returnsStructuredDraftForOrganizer() throws Exception {
    when(eventCopyService.generate(any())).thenReturn(new GenerateEventCopyResponseDto(
        "Paris Java Night", "Central Paris venue", "General Admission",
        "Talks and networking", List.of("Java", "AI")));

    mockMvc.perform(post("/api/v1/ai/event-copy").with(jwtFor("ROLE_ORGANIZER"))
            .contentType(MediaType.APPLICATION_JSON).content(validRequest()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eventName").value("Paris Java Night"))
        .andExpect(jsonPath("$.tags[1]").value("AI"));
  }

  @Test
  void returns429WhenPerUserAiLimitIsReached() throws Exception {
    doThrow(new AiRateLimitException("AI request limit reached"))
        .when(rateLimiter).check(userId.toString());

    mockMvc.perform(post("/api/v1/ai/event-copy").with(jwtFor("ROLE_ORGANIZER"))
            .contentType(MediaType.APPLICATION_JSON).content(validRequest()))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.error").value("AI request limit reached"));
  }

  private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwtFor(
      String authority) {
    return jwt().jwt(token -> token.subject(userId.toString()))
        .authorities(new SimpleGrantedAuthority(authority));
  }

  private String validRequest() {
    return """
        {"brief":"A Java and AI meetup in Paris","audience":"developers",\
        "tone":"welcoming","language":"English"}
        """;
  }
}
