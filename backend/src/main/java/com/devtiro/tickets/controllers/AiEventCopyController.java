package com.devtiro.tickets.controllers;

import com.devtiro.tickets.domain.dtos.GenerateEventCopyRequestDto;
import com.devtiro.tickets.domain.dtos.GenerateEventCopyResponseDto;
import com.devtiro.tickets.services.EventCopyService;
import com.devtiro.tickets.services.AiRequestRateLimiter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/event-copy")
@RequiredArgsConstructor
public class AiEventCopyController {

  private final EventCopyService eventCopyService;
  private final AiRequestRateLimiter rateLimiter;

  @PostMapping
  public ResponseEntity<GenerateEventCopyResponseDto> generate(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody GenerateEventCopyRequestDto request) {
    rateLimiter.check(jwt.getSubject());
    return ResponseEntity.ok(eventCopyService.generate(request));
  }
}
