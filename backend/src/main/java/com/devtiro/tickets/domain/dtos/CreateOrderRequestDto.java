package com.devtiro.tickets.domain.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequestDto {

  @NotNull(message = "Event ID is required")
  private UUID eventId;

  @NotNull(message = "Ticket type ID is required")
  private UUID ticketTypeId;

  @NotNull(message = "Quantity is required")
  @Min(value = 1, message = "Quantity must be at least 1")
  @Max(value = 10, message = "Quantity cannot exceed 10 per order")
  private Integer quantity;
}
