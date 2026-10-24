package com.devtiro.tickets.services.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.TicketsSoldOutException;
import com.devtiro.tickets.repositories.EventRepository;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketTypeRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.OrderService;
import com.devtiro.tickets.support.PostgresIntegrationTest;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderPostgresIntegrationTest extends PostgresIntegrationTest {

  @Autowired private OrderService orderService;
  @Autowired private UserRepository userRepository;
  @Autowired private EventRepository eventRepository;
  @Autowired private TicketTypeRepository ticketTypeRepository;
  @Autowired private TicketRepository ticketRepository;
  @Autowired private OrderRepository orderRepository;

  @Test
  void persistsOrderPaymentTicketsAndQrCodesInPostgres() {
    Fixture fixture = createFixture(3, 19.95);

    var result = orderService.createOrder(
        fixture.purchaserId(),
        "integration-" + UUID.randomUUID(),
        new CreateOrderRequestDto(fixture.eventId(), fixture.ticketTypeId(), 2));

    assertThat(result.order().getStatus()).isEqualTo(OrderStatusEnum.PAID);
    assertThat(result.order().getTotalAmount()).isEqualByComparingTo("39.90");
    assertThat(result.order().getPayments()).hasSize(1);
    assertThat(result.order().getItems().getFirst().getTicketIds()).hasSize(2);
    assertThat(ticketRepository.countByTicketTypeId(fixture.ticketTypeId())).isEqualTo(2);
    assertThat(orderRepository.findByIdAndPurchaserId(
        result.order().getId(), fixture.purchaserId())).isPresent();
  }

  @Test
  void concurrentPurchaseOfLastTicketAllowsOnlyOneOrder() throws Exception {
    Fixture fixture = createFixture(1, 25.00);
    CreateOrderRequestDto request = new CreateOrderRequestDto(
        fixture.eventId(), fixture.ticketTypeId(), 1);
    CountDownLatch ready = new CountDownLatch(2);
    CountDownLatch start = new CountDownLatch(1);
    AtomicInteger successes = new AtomicInteger();
    AtomicInteger soldOut = new AtomicInteger();

    try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
      Future<?> first = executor.submit(() -> purchaseConcurrently(
          fixture.purchaserId(), "concurrent-a-" + UUID.randomUUID(), request,
          ready, start, successes, soldOut));
      Future<?> second = executor.submit(() -> purchaseConcurrently(
          fixture.purchaserId(), "concurrent-b-" + UUID.randomUUID(), request,
          ready, start, successes, soldOut));

      assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
      start.countDown();
      first.get(30, TimeUnit.SECONDS);
      second.get(30, TimeUnit.SECONDS);
    }

    assertThat(successes).hasValue(1);
    assertThat(soldOut).hasValue(1);
    assertThat(ticketRepository.countByTicketTypeId(fixture.ticketTypeId())).isEqualTo(1);
    assertThat(orderRepository.findByPurchaserId(
        fixture.purchaserId(), org.springframework.data.domain.Pageable.unpaged()).getTotalElements())
        .isEqualTo(1);
  }

  private void purchaseConcurrently(
      UUID purchaserId,
      String idempotencyKey,
      CreateOrderRequestDto request,
      CountDownLatch ready,
      CountDownLatch start,
      AtomicInteger successes,
      AtomicInteger soldOut
  ) {
    ready.countDown();
    try {
      if (!start.await(10, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Concurrent test did not start in time");
      }
      orderService.createOrder(purchaserId, idempotencyKey, request);
      successes.incrementAndGet();
    } catch (TicketsSoldOutException ex) {
      soldOut.incrementAndGet();
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(ex);
    }
  }

  private Fixture createFixture(int stock, double price) {
    UUID suffix = UUID.randomUUID();
    User organizer = new User();
    organizer.setId(UUID.randomUUID());
    organizer.setName("Organizer");
    organizer.setEmail("organizer-%s@example.com".formatted(suffix));
    userRepository.saveAndFlush(organizer);

    User purchaser = new User();
    purchaser.setId(UUID.randomUUID());
    purchaser.setName("Attendee");
    purchaser.setEmail("attendee-%s@example.com".formatted(suffix));
    userRepository.saveAndFlush(purchaser);

    Event event = Event.builder()
        .name("Integration Test Event")
        .venue("Paris")
        .status(EventStatusEnum.PUBLISHED)
        .salesStart(LocalDateTime.now().minusHours(1))
        .salesEnd(LocalDateTime.now().plusHours(1))
        .organizer(organizer)
        .build();
    eventRepository.saveAndFlush(event);

    TicketType ticketType = TicketType.builder()
        .name("Test Ticket")
        .description("Integration test ticket")
        .price(price)
        .totalAvailable(stock)
        .event(event)
        .build();
    ticketTypeRepository.saveAndFlush(ticketType);
    return new Fixture(purchaser.getId(), event.getId(), ticketType.getId());
  }

  private record Fixture(UUID purchaserId, UUID eventId, UUID ticketTypeId) {
  }
}
