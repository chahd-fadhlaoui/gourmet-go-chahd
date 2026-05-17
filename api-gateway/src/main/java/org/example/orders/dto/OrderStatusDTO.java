package org.example.orders.dto;

import java.util.List;

public class OrderStatusDTO {
    private String orderId;
    private String status;
    private String lastEvent;
    private long lastUpdatedAt;
    private String sagaFlow;
    private List<SagaStepDTO> steps;

    public OrderStatusDTO() {
    }

    public OrderStatusDTO(String orderId, String status, String lastEvent, long lastUpdatedAt) {
        this.orderId = orderId;
        this.status = status;
        this.lastEvent = lastEvent;
        this.lastUpdatedAt = lastUpdatedAt;
    }

    public OrderStatusDTO(String orderId, String status, String lastEvent, long lastUpdatedAt,
            String sagaFlow, List<SagaStepDTO> steps) {
        this.orderId = orderId;
        this.status = status;
        this.lastEvent = lastEvent;
        this.lastUpdatedAt = lastUpdatedAt;
        this.sagaFlow = sagaFlow;
        this.steps = steps;
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

    public String getLastEvent() {
        return lastEvent;
    }

    public void setLastEvent(String lastEvent) {
        this.lastEvent = lastEvent;
    }

    public long getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(long lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }

    public String getSagaFlow() {
        return sagaFlow;
    }

    public void setSagaFlow(String sagaFlow) {
        this.sagaFlow = sagaFlow;
    }

    public List<SagaStepDTO> getSteps() {
        return steps;
    }

    public void setSteps(List<SagaStepDTO> steps) {
        this.steps = steps;
    }
}
