package com.devtiro.tickets.domain.dtos;

import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class OrderResponseDto {
  UUID id;
  OrderStatusEnum status;
  BigDecimal totalAmount;
  String currency;
  String idempotencyKey;
  List<OrderItemResponseDto> items;
  List<PaymentResponseDto> payments;
  LocalDateTime createdAt;
  LocalDateTime updatedAt;
}
