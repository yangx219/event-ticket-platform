package com.devtiro.tickets.domain.dtos;

import com.devtiro.tickets.domain.entities.PaymentProviderEnum;
import com.devtiro.tickets.domain.entities.PaymentStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PaymentResponseDto {
  UUID id;
  PaymentStatusEnum status;
  BigDecimal amount;
  String currency;
  PaymentProviderEnum provider;
  String providerReference;
  LocalDateTime createdAt;
}
