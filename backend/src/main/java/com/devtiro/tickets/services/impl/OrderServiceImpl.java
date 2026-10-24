package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.OrderCreationResult;
import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.dtos.OrderItemResponseDto;
import com.devtiro.tickets.domain.dtos.OrderResponseDto;
import com.devtiro.tickets.domain.dtos.PaymentResponseDto;
import com.devtiro.tickets.domain.entities.CustomerOrder;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.OrderItem;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.domain.entities.Payment;
import com.devtiro.tickets.domain.entities.PaymentProviderEnum;
import com.devtiro.tickets.domain.entities.PaymentStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketStatusEnum;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.OrderConflictException;
import com.devtiro.tickets.exceptions.OrderNotFoundException;
import com.devtiro.tickets.exceptions.TicketTypeNotFoundException;
import com.devtiro.tickets.exceptions.TicketsSoldOutException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketTypeRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.OrderService;
import com.devtiro.tickets.services.QrCodeService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

  private static final String DEFAULT_CURRENCY = "EUR";

  private final UserRepository userRepository;
  private final TicketTypeRepository ticketTypeRepository;
  private final TicketRepository ticketRepository;
  private final OrderRepository orderRepository;
  private final QrCodeService qrCodeService;

  @Override
  @Transactional
  public OrderCreationResult createOrder(
      UUID purchaserId,
      String idempotencyKey,
      CreateOrderRequestDto request
  ) {
    CustomerOrder existingOrder = orderRepository
        .findByPurchaserIdAndIdempotencyKey(purchaserId, idempotencyKey)
        .orElse(null);

    if (existingOrder != null) {
      assertSameRequest(existingOrder, request);
      return new OrderCreationResult(toDto(existingOrder), true);
    }

    User purchaser = userRepository.findById(purchaserId)
        .orElseThrow(() -> new UserNotFoundException(
            "User with ID %s was not found".formatted(purchaserId)));

    TicketType ticketType = ticketTypeRepository.findByIdWithLock(request.getTicketTypeId())
        .orElseThrow(() -> new TicketTypeNotFoundException(
            "Ticket type with ID %s was not found".formatted(request.getTicketTypeId())));

    validateTicketAvailability(ticketType, request.getEventId(), request.getQuantity());

    BigDecimal unitPrice = BigDecimal.valueOf(ticketType.getPrice())
        .setScale(2, RoundingMode.HALF_UP);
    BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));

    CustomerOrder order = CustomerOrder.builder()
        .purchaser(purchaser)
        .status(OrderStatusEnum.PENDING)
        .totalAmount(totalAmount)
        .currency(DEFAULT_CURRENCY)
        .idempotencyKey(idempotencyKey)
        .build();

    OrderItem item = OrderItem.builder()
        .order(order)
        .ticketType(ticketType)
        .ticketName(ticketType.getName())
        .unitPrice(unitPrice)
        .quantity(request.getQuantity())
        .lineTotal(totalAmount)
        .build();
    order.getItems().add(item);

    Payment payment = Payment.builder()
        .order(order)
        .status(PaymentStatusEnum.SUCCEEDED)
        .amount(totalAmount)
        .currency(DEFAULT_CURRENCY)
        .provider(PaymentProviderEnum.MOCK)
        .providerReference("mock_%s".formatted(UUID.randomUUID()))
        .build();
    order.getPayments().add(payment);
    order.setStatus(OrderStatusEnum.PAID);

    try {
      orderRepository.saveAndFlush(order);
    } catch (DataIntegrityViolationException ex) {
      throw new OrderConflictException(
          "An order with this idempotency key already exists");
    }

    for (int index = 0; index < request.getQuantity(); index++) {
      Ticket ticket = Ticket.builder()
          .status(TicketStatusEnum.PURCHASED)
          .ticketType(ticketType)
          .purchaser(purchaser)
          .orderItem(item)
          .build();
      Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
      item.getTickets().add(savedTicket);
      qrCodeService.generateQrCode(savedTicket);
    }

    return new OrderCreationResult(toDto(order), false);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<OrderResponseDto> listOrders(UUID purchaserId, Pageable pageable) {
    return orderRepository.findByPurchaserId(purchaserId, pageable).map(this::toDto);
  }

  @Override
  @Transactional(readOnly = true)
  public OrderResponseDto getOrder(UUID purchaserId, UUID orderId) {
    return orderRepository.findByIdAndPurchaserId(orderId, purchaserId)
        .map(this::toDto)
        .orElseThrow(() -> new OrderNotFoundException(
            "Order with ID %s was not found".formatted(orderId)));
  }

  private void validateTicketAvailability(TicketType ticketType, UUID eventId, int quantity) {
    Event event = ticketType.getEvent();
    if (event == null || !eventId.equals(event.getId())) {
      throw new TicketTypeNotFoundException(
          "Ticket type with ID %s was not found for event %s"
              .formatted(ticketType.getId(), eventId));
    }
    if (!EventStatusEnum.PUBLISHED.equals(event.getStatus())) {
      throw new TicketsSoldOutException("Tickets are not available for this event");
    }

    LocalDateTime now = LocalDateTime.now();
    if ((event.getSalesStart() != null && now.isBefore(event.getSalesStart()))
        || (event.getSalesEnd() != null && now.isAfter(event.getSalesEnd()))) {
      throw new TicketsSoldOutException("Ticket sales are not currently open");
    }

    int purchasedTickets = ticketRepository.countByTicketTypeId(ticketType.getId());
    Integer totalAvailable = ticketType.getTotalAvailable();
    if (totalAvailable == null || purchasedTickets + quantity > totalAvailable) {
      throw new TicketsSoldOutException(
          "Only %d tickets remain for this ticket type"
              .formatted(Math.max(0, totalAvailable == null ? 0 : totalAvailable - purchasedTickets)));
    }
  }

  private void assertSameRequest(CustomerOrder order, CreateOrderRequestDto request) {
    OrderItem item = order.getItems().stream().findFirst()
        .orElseThrow(() -> new OrderConflictException(
            "The existing idempotent order has no order item"));
    UUID existingEventId = item.getTicketType().getEvent().getId();
    if (!existingEventId.equals(request.getEventId())
        || !item.getTicketType().getId().equals(request.getTicketTypeId())
        || !item.getQuantity().equals(request.getQuantity())) {
      throw new OrderConflictException(
          "The idempotency key was already used for a different order request");
    }
  }

  private OrderResponseDto toDto(CustomerOrder order) {
    List<OrderItemResponseDto> items = order.getItems().stream()
        .map(item -> OrderItemResponseDto.builder()
            .id(item.getId())
            .ticketTypeId(item.getTicketType().getId())
            .ticketName(item.getTicketName())
            .unitPrice(item.getUnitPrice())
            .quantity(item.getQuantity())
            .lineTotal(item.getLineTotal())
            .ticketIds(item.getTickets().stream().map(Ticket::getId).toList())
            .build())
        .toList();

    List<PaymentResponseDto> payments = order.getPayments().stream()
        .map(payment -> PaymentResponseDto.builder()
            .id(payment.getId())
            .status(payment.getStatus())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .provider(payment.getProvider())
            .providerReference(payment.getProviderReference())
            .createdAt(payment.getCreatedAt())
            .build())
        .toList();

    return OrderResponseDto.builder()
        .id(order.getId())
        .status(order.getStatus())
        .totalAmount(order.getTotalAmount())
        .currency(order.getCurrency())
        .idempotencyKey(order.getIdempotencyKey())
        .items(items)
        .payments(payments)
        .createdAt(order.getCreatedAt())
        .updatedAt(order.getUpdatedAt())
        .build();
  }
}
