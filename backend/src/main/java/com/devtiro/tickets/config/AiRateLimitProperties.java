package com.devtiro.tickets.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "eventpilot.ai.rate-limit")
public record AiRateLimitProperties(int requests, Duration window) {
}
