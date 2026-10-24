package com.devtiro.tickets.services;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devtiro.tickets.config.AiRateLimitProperties;
import com.devtiro.tickets.exceptions.AiRateLimitException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AiRequestRateLimiterTest {

  @Test
  void rejectsRequestsAbovePerUserLimit() {
    Clock clock = Clock.fixed(Instant.parse("2026-10-22T12:00:00Z"), ZoneOffset.UTC);
    AiRequestRateLimiter limiter = new AiRequestRateLimiter(
        new AiRateLimitProperties(2, Duration.ofMinutes(1)), clock);

    limiter.check("user-1");
    limiter.check("user-1");

    assertThatThrownBy(() -> limiter.check("user-1"))
        .isInstanceOf(AiRateLimitException.class)
        .hasMessageContaining("60 seconds");
  }

  @Test
  void tracksUsersIndependently() {
    Clock clock = Clock.fixed(Instant.parse("2026-10-22T12:00:00Z"), ZoneOffset.UTC);
    AiRequestRateLimiter limiter = new AiRequestRateLimiter(
        new AiRateLimitProperties(1, Duration.ofMinutes(1)), clock);

    limiter.check("user-1");

    assertThatCode(() -> limiter.check("user-2")).doesNotThrowAnyException();
  }
}
