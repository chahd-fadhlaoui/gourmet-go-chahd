package org.example.orders.dto;

public class WorkflowTicketDTO {
    private String orderId;
    private String status;
    private long createdAt;

    public WorkflowTicketDTO() {
    }

    public WorkflowTicketDTO(String orderId, String status, long createdAt) {
        this.orderId = orderId;
        this.status = status;
        this.createdAt = createdAt;
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

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
}
