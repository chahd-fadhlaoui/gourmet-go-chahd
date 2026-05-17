package org.example.orders.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CreateOrderRequestDTO {
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than 0")
    private Double amount;

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
