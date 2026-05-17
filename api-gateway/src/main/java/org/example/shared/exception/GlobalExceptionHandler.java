package org.example.shared.exception;

import org.example.shared.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import io.grpc.StatusRuntimeException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        StringBuilder message = new StringBuilder();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            message.append(fieldName).append(": ").append(errorMessage).append("; ");
        });

        logger.warn("Validation error: {}", message);
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", message.toString()));
    }

    @ExceptionHandler(StatusRuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleGrpcException(StatusRuntimeException ex) {
        logger.error("gRPC error: {} - {}", ex.getStatus().getCode(), ex.getMessage());

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("GRPC_ERROR",
                        "Service temporarily unavailable: " + ex.getStatus().getDescription()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Invalid argument: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("INVALID_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        logger.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
