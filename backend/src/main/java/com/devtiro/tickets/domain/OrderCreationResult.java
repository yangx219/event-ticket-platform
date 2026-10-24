package com.devtiro.tickets.domain;

import com.devtiro.tickets.domain.dtos.OrderResponseDto;

public record OrderCreationResult(OrderResponseDto order, boolean idempotentReplay) {
}
