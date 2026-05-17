package org.example.orders.dto;

public class CreateOrderResponseDTO {
    private String orderId;
    private String status;
    private Double amount;

    public CreateOrderResponseDTO() {
    }

    public CreateOrderResponseDTO(String orderId, String status) {
        this.orderId = orderId;
        this.status = status;
    }

    public CreateOrderResponseDTO(String orderId, String status, Double amount) {
        this.orderId = orderId;
        this.status = status;
        this.amount = amount;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
