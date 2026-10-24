package com.devtiro.tickets.domain.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateEventCopyRequestDto(
    @NotBlank(message = "Describe the event you want to create")
    @Size(max = 1200, message = "Event brief must not exceed 1200 characters")
    String brief,
    @Size(max = 200, message = "Audience must not exceed 200 characters")
    String audience,
    @Size(max = 50, message = "Tone must not exceed 50 characters")
    String tone,
    @Size(max = 50, message = "Language must not exceed 50 characters")
    String language) {
}
