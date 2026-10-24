package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.OrderCreationResult;
import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.dtos.OrderResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
  OrderCreationResult createOrder(
      UUID purchaserId,
      String idempotencyKey,
      CreateOrderRequestDto request
  );

  Page<OrderResponseDto> listOrders(UUID purchaserId, Pageable pageable);

  OrderResponseDto getOrder(UUID purchaserId, UUID orderId);
}
