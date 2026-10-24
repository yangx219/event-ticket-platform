package com.devtiro.tickets.domain.dtos;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class OrderItemResponseDto {
  UUID id;
  UUID ticketTypeId;
  String ticketName;
  BigDecimal unitPrice;
  Integer quantity;
  BigDecimal lineTotal;
  List<UUID> ticketIds;
}
