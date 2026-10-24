package com.devtiro.tickets.domain.dtos;

import java.util.List;

public record GenerateEventCopyResponseDto(
    String eventName,
    String venueDescription,
    String ticketTypeName,
    String ticketDescription,
    List<String> tags) {
}
