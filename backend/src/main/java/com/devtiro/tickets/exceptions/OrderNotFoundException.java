package com.devtiro.tickets.exceptions;

public class OrderNotFoundException extends EventTicketException {
  public OrderNotFoundException(String message) {
    super(message);
  }
}
