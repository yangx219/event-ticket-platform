package com.devtiro.tickets.controllers;

import static com.devtiro.tickets.util.JwtUtil.parseUserId;

import com.devtiro.tickets.domain.OrderCreationResult;
import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.dtos.OrderResponseDto;
import com.devtiro.tickets.services.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders")
public class OrderController {

  private final OrderService orderService;

  @PostMapping
  public ResponseEntity<OrderResponseDto> createOrder(
      @AuthenticationPrincipal Jwt jwt,
      @RequestHeader("Idempotency-Key")
      @NotBlank(message = "Idempotency-Key header is required")
      @Size(max = 100, message = "Idempotency-Key cannot exceed 100 characters")
      String idempotencyKey,
      @Valid @RequestBody CreateOrderRequestDto request
  ) {
    OrderCreationResult result = orderService.createOrder(
        parseUserId(jwt), idempotencyKey, request);

    if (result.idempotentReplay()) {
      return ResponseEntity.ok(result.order());
    }
    return ResponseEntity.created(URI.create("/api/v1/orders/" + result.order().getId()))
        .body(result.order());
  }

  @GetMapping
  public Page<OrderResponseDto> listOrders(
      @AuthenticationPrincipal Jwt jwt,
      Pageable pageable
  ) {
    return orderService.listOrders(parseUserId(jwt), pageable);
  }

  @GetMapping("/{orderId}")
  public OrderResponseDto getOrder(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID orderId
  ) {
    return orderService.getOrder(parseUserId(jwt), orderId);
  }
}
