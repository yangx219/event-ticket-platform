package com.devtiro.tickets.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "eventpilot.ai")
public record AiProperties(
    boolean enabled,
    String apiKey,
    String model,
    String baseUrl,
    Duration timeout) {
}
