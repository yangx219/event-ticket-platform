package com.devtiro.tickets.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devtiro.tickets.config.AiProperties;
import com.devtiro.tickets.domain.dtos.GenerateEventCopyRequestDto;
import com.devtiro.tickets.domain.dtos.GenerateEventCopyResponseDto;
import com.devtiro.tickets.exceptions.AiServiceException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class OpenAiEventCopyServiceTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void rejectsCallsWhenAiIsDisabledWithoutContactingProvider() {
    OpenAiEventCopyService service = service(
        new AiProperties(false, "", "test-model", "https://example.invalid", Duration.ofSeconds(1)));

    assertThatThrownBy(() -> service.generate(
        new GenerateEventCopyRequestDto("Java meetup", "developers", "friendly", "English")))
        .isInstanceOf(AiServiceException.class)
        .hasMessageContaining("disabled");
  }

  @Test
  void parsesStrictStructuredOutput() throws Exception {
    OpenAiEventCopyService service = service(enabledProperties());
    String providerResponse = """
        {"output":[{"content":[{"type":"output_text","text":"{\\"eventName\\":\\"Paris Java Night\\",\\"venueDescription\\":\\"A welcoming central Paris venue.\\",\\"ticketTypeName\\":\\"General Admission\\",\\"ticketDescription\\":\\"Includes talks and networking.\\",\\"tags\\":[\\"Java\\",\\"AI\\"]}"}]}]}
        """;

    GenerateEventCopyResponseDto result = service.parseResponse(
        objectMapper.readTree(providerResponse));

    assertThat(result.eventName()).isEqualTo("Paris Java Night");
    assertThat(result.tags()).containsExactly("Java", "AI");
  }

  @Test
  void rejectsProviderResponseWithoutOutputText() throws Exception {
    OpenAiEventCopyService service = service(enabledProperties());

    assertThatThrownBy(() -> service.parseResponse(objectMapper.readTree("{\"output\":[]}")))
        .isInstanceOf(AiServiceException.class)
        .hasMessageContaining("no usable text");
  }

  private OpenAiEventCopyService service(AiProperties properties) {
    return new OpenAiEventCopyService(
        RestClient.builder().baseUrl(properties.baseUrl()).build(), objectMapper, properties);
  }

  private AiProperties enabledProperties() {
    return new AiProperties(true, "test-key", "test-model", "https://example.invalid",
        Duration.ofSeconds(1));
  }
}
