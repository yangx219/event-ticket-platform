package com.devtiro.tickets.services;

import com.devtiro.tickets.config.AiRateLimitProperties;
import com.devtiro.tickets.exceptions.AiRateLimitException;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AiRequestRateLimiter {

  private final AiRateLimitProperties properties;
  private final Clock clock;
  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

  @Autowired
  public AiRequestRateLimiter(AiRateLimitProperties properties) {
    this(properties, Clock.systemUTC());
  }

  AiRequestRateLimiter(AiRateLimitProperties properties, Clock clock) {
    this.properties = properties;
    this.clock = clock;
  }

  public void check(String userId) {
    Instant now = clock.instant();
    windows.compute(userId, (key, current) -> {
      if (current == null || !now.isBefore(current.startedAt().plus(properties.window()))) {
        return new Window(now, 1);
      }
      if (current.requests() >= properties.requests()) {
        throw new AiRateLimitException(
            "AI request limit reached. Try again after " + properties.window().toSeconds()
                + " seconds.");
      }
      return new Window(current.startedAt(), current.requests() + 1);
    });
  }

  private record Window(Instant startedAt, int requests) {
  }
}
