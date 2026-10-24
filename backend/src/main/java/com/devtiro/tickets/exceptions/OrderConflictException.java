package com.devtiro.tickets.exceptions;

public class OrderConflictException extends EventTicketException {
  public OrderConflictException(String message) {
    super(message);
  }
}
