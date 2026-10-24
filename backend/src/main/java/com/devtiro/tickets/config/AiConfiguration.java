package com.devtiro.tickets.config;

import java.net.http.HttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties({AiProperties.class, AiRateLimitProperties.class})
public class AiConfiguration {

  @Bean
  RestClient openAiRestClient(AiProperties properties) {
    HttpClient client = HttpClient.newBuilder()
        .connectTimeout(properties.timeout())
        .build();
    JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(client);
    requestFactory.setReadTimeout(properties.timeout());

    return RestClient.builder()
        .baseUrl(properties.baseUrl())
        .requestFactory(requestFactory)
        .defaultHeader("Authorization", "Bearer " + properties.apiKey())
        .build();
  }
}
