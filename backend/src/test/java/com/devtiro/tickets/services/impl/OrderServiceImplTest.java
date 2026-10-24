package com.devtiro.tickets.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devtiro.tickets.domain.OrderCreationResult;
import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.entities.CustomerOrder;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.OrderItem;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.OrderConflictException;
import com.devtiro.tickets.exceptions.TicketsSoldOutException;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketTypeRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.QrCodeService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

  @Mock private UserRepository userRepository;
  @Mock private TicketTypeRepository ticketTypeRepository;
  @Mock private TicketRepository ticketRepository;
  @Mock private OrderRepository orderRepository;
  @Mock private QrCodeService qrCodeService;

  private OrderServiceImpl orderService;

  private UUID purchaserId;
  private UUID eventId;
  private UUID ticketTypeId;
  private User purchaser;
  private TicketType ticketType;

  @BeforeEach
  void setUp() {
    orderService = new OrderServiceImpl(
        userRepository,
        ticketTypeRepository,
        ticketRepository,
        orderRepository,
        qrCodeService
    );
    purchaserId = UUID.randomUUID();
    eventId = UUID.randomUUID();
    ticketTypeId = UUID.randomUUID();
    purchaser = new User();
    purchaser.setId(purchaserId);

    Event event = Event.builder()
        .id(eventId)
        .name("Jazz Under the Stars")
        .venue("Paris")
        .status(EventStatusEnum.PUBLISHED)
        .salesStart(LocalDateTime.now().minusDays(1))
        .salesEnd(LocalDateTime.now().plusDays(1))
        .build();
    ticketType = TicketType.builder()
        .id(ticketTypeId)
        .name("General Admission")
        .price(39.90)
        .totalAvailable(20)
        .event(event)
        .build();
  }

  @Test
  void createsPaidOrderAndIssuesRequestedTickets() {
    CreateOrderRequestDto request = new CreateOrderRequestDto(eventId, ticketTypeId, 2);
    when(orderRepository.findByPurchaserIdAndIdempotencyKey(purchaserId, "checkout-1"))
        .thenReturn(Optional.empty());
    when(userRepository.findById(purchaserId)).thenReturn(Optional.of(purchaser));
    when(ticketTypeRepository.findByIdWithLock(ticketTypeId))
        .thenReturn(Optional.of(ticketType));
    when(ticketRepository.countByTicketTypeId(ticketTypeId)).thenReturn(3);
    when(orderRepository.saveAndFlush(any(CustomerOrder.class))).thenAnswer(invocation -> {
      CustomerOrder order = invocation.getArgument(0);
      order.setId(UUID.randomUUID());
      order.getItems().getFirst().setId(UUID.randomUUID());
      order.getPayments().getFirst().setId(UUID.randomUUID());
      return order;
    });
    AtomicInteger ticketSequence = new AtomicInteger();
    when(ticketRepository.saveAndFlush(any(Ticket.class))).thenAnswer(invocation -> {
      Ticket ticket = invocation.getArgument(0);
      ticket.setId(new UUID(0, ticketSequence.incrementAndGet()));
      return ticket;
    });

    OrderCreationResult result = orderService.createOrder(purchaserId, "checkout-1", request);

    assertThat(result.idempotentReplay()).isFalse();
    assertThat(result.order().getStatus()).isEqualTo(OrderStatusEnum.PAID);
    assertThat(result.order().getTotalAmount()).isEqualByComparingTo(new BigDecimal("79.80"));
    assertThat(result.order().getItems()).hasSize(1);
    assertThat(result.order().getItems().getFirst().getTicketIds()).hasSize(2);
    assertThat(result.order().getPayments()).hasSize(1);
    verify(qrCodeService, org.mockito.Mockito.times(2)).generateQrCode(any(Ticket.class));
  }

  @Test
  void returnsExistingOrderForSameIdempotentRequest() {
    CreateOrderRequestDto request = new CreateOrderRequestDto(eventId, ticketTypeId, 2);
    CustomerOrder existingOrder = existingOrder(2);
    when(orderRepository.findByPurchaserIdAndIdempotencyKey(purchaserId, "checkout-1"))
        .thenReturn(Optional.of(existingOrder));

    OrderCreationResult result = orderService.createOrder(purchaserId, "checkout-1", request);

    assertThat(result.idempotentReplay()).isTrue();
    assertThat(result.order().getId()).isEqualTo(existingOrder.getId());
    verify(ticketTypeRepository, never()).findByIdWithLock(any());
    verify(ticketRepository, never()).saveAndFlush(any());
  }

  @Test
  void rejectsReuseOfIdempotencyKeyForDifferentRequest() {
    CustomerOrder existingOrder = existingOrder(1);
    when(orderRepository.findByPurchaserIdAndIdempotencyKey(purchaserId, "checkout-1"))
        .thenReturn(Optional.of(existingOrder));

    assertThatThrownBy(() -> orderService.createOrder(
        purchaserId,
        "checkout-1",
        new CreateOrderRequestDto(eventId, ticketTypeId, 2)))
        .isInstanceOf(OrderConflictException.class)
        .hasMessageContaining("different order request");
  }

  @Test
  void rejectsOrderWhenRequestedQuantityExceedsRemainingInventory() {
    CreateOrderRequestDto request = new CreateOrderRequestDto(eventId, ticketTypeId, 2);
    ticketType.setTotalAvailable(10);
    when(orderRepository.findByPurchaserIdAndIdempotencyKey(purchaserId, "checkout-1"))
        .thenReturn(Optional.empty());
    when(userRepository.findById(purchaserId)).thenReturn(Optional.of(purchaser));
    when(ticketTypeRepository.findByIdWithLock(ticketTypeId))
        .thenReturn(Optional.of(ticketType));
    when(ticketRepository.countByTicketTypeId(ticketTypeId)).thenReturn(9);

    assertThatThrownBy(() -> orderService.createOrder(purchaserId, "checkout-1", request))
        .isInstanceOf(TicketsSoldOutException.class)
        .hasMessageContaining("Only 1 tickets remain");
    verify(orderRepository, never()).saveAndFlush(any());
  }

  private CustomerOrder existingOrder(int quantity) {
    CustomerOrder order = CustomerOrder.builder()
        .id(UUID.randomUUID())
        .purchaser(purchaser)
        .status(OrderStatusEnum.PAID)
        .totalAmount(new BigDecimal("39.90").multiply(BigDecimal.valueOf(quantity)))
        .currency("EUR")
        .idempotencyKey("checkout-1")
        .build();
    OrderItem item = OrderItem.builder()
        .id(UUID.randomUUID())
        .order(order)
        .ticketType(ticketType)
        .ticketName(ticketType.getName())
        .unitPrice(new BigDecimal("39.90"))
        .quantity(quantity)
        .lineTotal(new BigDecimal("39.90").multiply(BigDecimal.valueOf(quantity)))
        .build();
    order.getItems().add(item);
    return order;
  }
}
