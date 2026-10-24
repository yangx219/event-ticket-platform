package com.devtiro.tickets.controllers;

import com.devtiro.tickets.domain.dtos.ErrorDto;
import com.devtiro.tickets.exceptions.EventNotFoundException;
import com.devtiro.tickets.exceptions.EventUpdateException;
import com.devtiro.tickets.exceptions.EventValidationException;
import com.devtiro.tickets.exceptions.OrderConflictException;
import com.devtiro.tickets.exceptions.OrderNotFoundException;
import com.devtiro.tickets.exceptions.AiServiceException;
import com.devtiro.tickets.exceptions.AiRateLimitException;
import com.devtiro.tickets.exceptions.QrCodeGenerationException;
import com.devtiro.tickets.exceptions.QrCodeNotFoundException;
import com.devtiro.tickets.exceptions.TicketNotFoundException;
import com.devtiro.tickets.exceptions.TicketTypeNotFoundException;
import com.devtiro.tickets.exceptions.TicketsSoldOutException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(OrderNotFoundException.class)
  public ResponseEntity<ErrorDto> handleOrderNotFoundException(OrderNotFoundException ex) {
    log.warn("Order not found: {}", ex.getMessage());
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Order not found");
    return new ResponseEntity<>(errorDto, HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(OrderConflictException.class)
  public ResponseEntity<ErrorDto> handleOrderConflictException(OrderConflictException ex) {
    log.warn("Order conflict: {}", ex.getMessage());
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError(ex.getMessage());
    return new ResponseEntity<>(errorDto, HttpStatus.CONFLICT);
  }

  @ExceptionHandler(AiServiceException.class)
  public ResponseEntity<ErrorDto> handleAiServiceException(AiServiceException ex) {
    return new ResponseEntity<>(new ErrorDto(ex.getMessage()), HttpStatus.SERVICE_UNAVAILABLE);
  }

  @ExceptionHandler(AiRateLimitException.class)
  public ResponseEntity<ErrorDto> handleAiRateLimitException(AiRateLimitException ex) {
    return new ResponseEntity<>(new ErrorDto(ex.getMessage()), HttpStatus.TOO_MANY_REQUESTS);
  }


  @ExceptionHandler(TicketNotFoundException.class)
  public ResponseEntity<ErrorDto> handleTicketNotFoundException(TicketNotFoundException ex) {
    log.error("Caught TicketNotFoundException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Ticket not found");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }


  @ExceptionHandler(TicketsSoldOutException.class)
  public ResponseEntity<ErrorDto> handleTicketsSoldOutException(TicketsSoldOutException ex) {
    log.error("Caught TicketsSoldOutException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError(ex.getMessage() != null
        ? ex.getMessage()
        : "Tickets are sold out for this ticket type");
    return new ResponseEntity<>(errorDto, HttpStatus.CONFLICT);
  }

  @ExceptionHandler(QrCodeNotFoundException.class)
  public ResponseEntity<ErrorDto> handleQrCodeNotFoundException(QrCodeNotFoundException ex) {
    log.error("Caught QrCodeNotFoundException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("QR code not found");
    return new ResponseEntity<>(errorDto, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(QrCodeGenerationException.class)
  public ResponseEntity<ErrorDto> handleQrCodeGenerationException(QrCodeGenerationException ex) {
    log.error("Caught QrCodeGenerationException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Unable to generate QR Code");
    return new ResponseEntity<>(errorDto, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(EventUpdateException.class)
  public ResponseEntity<ErrorDto> handleEventUpdateException(EventUpdateException ex) {
    log.error("Caught EventUpdateException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Unable to update event");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(EventValidationException.class)
  public ResponseEntity<ErrorDto> handleEventValidationException(EventValidationException ex) {
    log.warn("Event validation failed: {}", ex.getMessage());
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError(ex.getMessage());
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(TicketTypeNotFoundException.class)
  public ResponseEntity<ErrorDto> handleTicketTypeNotFoundException(
      TicketTypeNotFoundException ex) {
    log.error("Caught TicketTypeNotFoundException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Ticket type not found");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(EventNotFoundException.class)
  public ResponseEntity<ErrorDto> handleEventNotFoundException(EventNotFoundException ex) {
    log.error("Caught EventNotFoundException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Event not found");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(UserNotFoundException.class)
  public ResponseEntity<ErrorDto> handleUserNotFoundException(UserNotFoundException ex) {
    log.error("Caught UserNotFoundException", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("User not found");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorDto> handleMethodArgumentNotValidException(
      MethodArgumentNotValidException ex
  ) {
    log.error("Caught MethodArgumentNotValidException", ex);
    ErrorDto errorDto = new ErrorDto();

    BindingResult bindingResult = ex.getBindingResult();
    List<FieldError> fieldErrors = bindingResult.getFieldErrors();
    String errorMessage = fieldErrors.stream()
        .findFirst()
        .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
        .orElse("Validation error occurred");

    errorDto.setError(errorMessage);
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorDto> handleConstraintViolation(
      ConstraintViolationException ex
  ) {
    log.error("Caught ConstraintViolationException", ex);
    ErrorDto errorDto = new ErrorDto();

    String errorMessage = ex.getConstraintViolations()
        .stream()
        .findFirst()
        .map(violation ->
            violation.getPropertyPath() + ": " + violation.getMessage()
        ).orElse("Constraint violation occurred");

    errorDto.setError(errorMessage);
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<ErrorDto> handleMissingRequestHeader(
      MissingRequestHeaderException ex
  ) {
    log.warn("Missing request header: {}", ex.getHeaderName());
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError(ex.getHeaderName() + " header is required");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ErrorDto> handleHandlerMethodValidation(
      HandlerMethodValidationException ex
  ) {
    log.warn("Request parameter validation failed: {}", ex.getMessage());
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("Request parameter validation failed");
    return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorDto> handleException(Exception ex) {
    log.error("Caught exception", ex);
    ErrorDto errorDto = new ErrorDto();
    errorDto.setError("An unknown error occurred");
    return new ResponseEntity<>(errorDto, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
