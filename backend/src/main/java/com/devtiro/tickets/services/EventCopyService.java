package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.dtos.GenerateEventCopyRequestDto;
import com.devtiro.tickets.domain.dtos.GenerateEventCopyResponseDto;

public interface EventCopyService {

  GenerateEventCopyResponseDto generate(GenerateEventCopyRequestDto request);
}
