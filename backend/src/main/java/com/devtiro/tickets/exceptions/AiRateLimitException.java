package com.devtiro.tickets.exceptions;

public class AiRateLimitException extends RuntimeException {

  public AiRateLimitException(String message) {
    super(message);
  }
}
