package com.devtiro.tickets.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devtiro.tickets.config.JwtAuthenticationConverter;
import com.devtiro.tickets.config.SecurityConfig;
import com.devtiro.tickets.domain.OrderCreationResult;
import com.devtiro.tickets.domain.dtos.OrderResponseDto;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.exceptions.OrderConflictException;
import com.devtiro.tickets.exceptions.OrderNotFoundException;
import com.devtiro.tickets.filters.UserProvisioningFilter;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.OrderService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(OrderController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, UserProvisioningFilter.class})
class OrderControllerSecurityTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private OrderService orderService;
  @MockitoBean private UserRepository userRepository;
  @MockitoBean private JwtAuthenticationConverter jwtAuthenticationConverter;
  @MockitoBean private JwtDecoder jwtDecoder;

  private UUID userId;
  private UUID eventId;
  private UUID ticketTypeId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    eventId = UUID.randomUUID();
    ticketTypeId = UUID.randomUUID();
    when(userRepository.existsById(userId)).thenReturn(true);
  }

  @Test
  void returns401WhenUserIsNotAuthenticated() throws Exception {
    mockMvc.perform(get("/api/v1/orders"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void returns403WhenUserDoesNotHaveAttendeeRole() throws Exception {
    mockMvc.perform(get("/api/v1/orders").with(jwtFor("ROLE_ORGANIZER")))
        .andExpect(status().isForbidden());
  }

  @Test
  void returns400WhenIdempotencyHeaderIsMissing() throws Exception {
    mockMvc.perform(post("/api/v1/orders")
            .with(jwtFor("ROLE_ATTENDEE"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validRequest()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Idempotency-Key header is required"));
  }

  @Test
  void returns400WhenQuantityIsInvalid() throws Exception {
    mockMvc.perform(post("/api/v1/orders")
            .with(jwtFor("ROLE_ATTENDEE"))
            .header("Idempotency-Key", "checkout-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"eventId":"%s","ticketTypeId":"%s","quantity":0}
                """.formatted(eventId, ticketTypeId)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("quantity: Quantity must be at least 1"));
  }

  @Test
  void returns409WhenIdempotencyKeyConflicts() throws Exception {
    when(orderService.createOrder(eq(userId), eq("checkout-1"), any()))
        .thenThrow(new OrderConflictException("Idempotency key conflict"));

    mockMvc.perform(post("/api/v1/orders")
            .with(jwtFor("ROLE_ATTENDEE"))
            .header("Idempotency-Key", "checkout-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(validRequest()))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("Idempotency key conflict"));
  }

  @Test
  void returns404WhenOrderDoesNotBelongToCurrentUser() throws Exception {
    UUID orderId = UUID.randomUUID();
    when(orderService.getOrder(userId, orderId))
        .thenThrow(new OrderNotFoundException("Order not found"));

    mockMvc.perform(get("/api/v1/orders/{orderId}", orderId)
            .with(jwtFor("ROLE_ATTENDEE")))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("Order not found"));
  }

  @Test
  void returns201AndLocationWhenOrderIsCreated() throws Exception {
    UUID orderId = UUID.randomUUID();
    OrderResponseDto response = OrderResponseDto.builder()
        .id(orderId)
        .status(OrderStatusEnum.PAID)
        .totalAmount(new BigDecimal("25.00"))
        .currency("EUR")
        .idempotencyKey("checkout-1")
        .items(List.of())
        .payments(List.of())
        .build();
    when(orderService.createOrder(eq(userId), eq("checkout-1"), any()))
        .thenReturn(new OrderCreationResult(response, false));

    mockMvc.perform(post("/api/v1/orders")
            .with(jwtFor("ROLE_ATTENDEE"))
            .header("Idempotency-Key", "checkout-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(validRequest()))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", "/api/v1/orders/" + orderId))
        .andExpect(jsonPath("$.status").value("PAID"));
  }

  private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwtFor(
      String authority
  ) {
    return jwt()
        .jwt(token -> token.subject(userId.toString()))
        .authorities(new SimpleGrantedAuthority(authority));
  }

  private String validRequest() {
    return """
        {"eventId":"%s","ticketTypeId":"%s","quantity":1}
        """.formatted(eventId, ticketTypeId);
  }
}
