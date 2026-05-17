package org.example.orders.dto;

public class WorkflowPaymentDTO {
    private String orderId;
    private double amount;
    private boolean authorized;
    private long createdAt;

    public WorkflowPaymentDTO() {
    }

    public WorkflowPaymentDTO(String orderId, double amount, boolean authorized, long createdAt) {
        this.orderId = orderId;
        this.amount = amount;
        this.authorized = authorized;
        this.createdAt = createdAt;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public boolean isAuthorized() {
        return authorized;
    }

    public void setAuthorized(boolean authorized) {
        this.authorized = authorized;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
}
