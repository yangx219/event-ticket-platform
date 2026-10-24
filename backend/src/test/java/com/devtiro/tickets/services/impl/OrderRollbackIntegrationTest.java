package com.devtiro.tickets.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.QrCodeGenerationException;
import com.devtiro.tickets.repositories.EventRepository;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketTypeRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.OrderService;
import com.devtiro.tickets.services.QrCodeService;
import com.devtiro.tickets.support.PostgresIntegrationTest;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class OrderRollbackIntegrationTest extends PostgresIntegrationTest {

  @Autowired private OrderService orderService;
  @Autowired private UserRepository userRepository;
  @Autowired private EventRepository eventRepository;
  @Autowired private TicketTypeRepository ticketTypeRepository;
  @Autowired private TicketRepository ticketRepository;
  @Autowired private OrderRepository orderRepository;

  @MockitoBean private QrCodeService qrCodeService;

  @Test
  void rollsBackOrderPaymentAndTicketWhenQrGenerationFails() {
    UUID suffix = UUID.randomUUID();
    User organizer = user("Organizer", "rollback-organizer-%s@example.com".formatted(suffix));
    User purchaser = user("Attendee", "rollback-attendee-%s@example.com".formatted(suffix));
    Event event = Event.builder()
        .name("Rollback Test Event")
        .venue("Paris")
        .status(EventStatusEnum.PUBLISHED)
        .salesStart(LocalDateTime.now().minusHours(1))
        .salesEnd(LocalDateTime.now().plusHours(1))
        .organizer(organizer)
        .build();
    eventRepository.saveAndFlush(event);
    TicketType ticketType = TicketType.builder()
        .name("Rollback Ticket")
        .description("Must not survive rollback")
        .price(10.00)
        .totalAvailable(2)
        .event(event)
        .build();
    ticketTypeRepository.saveAndFlush(ticketType);
    String idempotencyKey = "rollback-" + UUID.randomUUID();
    when(qrCodeService.generateQrCode(any(Ticket.class)))
        .thenThrow(new QrCodeGenerationException("Simulated QR failure"));

    assertThatThrownBy(() -> orderService.createOrder(
        purchaser.getId(),
        idempotencyKey,
        new CreateOrderRequestDto(event.getId(), ticketType.getId(), 1)))
        .isInstanceOf(QrCodeGenerationException.class);

    assertThat(orderRepository.findByPurchaserIdAndIdempotencyKey(
        purchaser.getId(), idempotencyKey)).isEmpty();
    assertThat(ticketRepository.countByTicketTypeId(ticketType.getId())).isZero();
  }

  private User user(String name, String email) {
    User user = new User();
    user.setId(UUID.randomUUID());
    user.setName(name);
    user.setEmail(email);
    return userRepository.saveAndFlush(user);
  }
}
