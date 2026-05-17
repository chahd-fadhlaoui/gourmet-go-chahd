package org.example.orders.dto;

public class SagaStepDTO {
    private String id;
    private String label;
    private String service;
    private String action;
    private String description;
    private String status;
    private String icon;
    private Long timestamp;
    private String errorMessage;

    public SagaStepDTO() {
    }

    public SagaStepDTO(String id, String label, String service, String action, String description, String status,
            String icon, Long timestamp, String errorMessage) {
        this.id = id;
        this.label = label;
        this.service = service;
        this.action = action;
        this.description = description;
        this.status = status;
        this.icon = icon;
        this.timestamp = timestamp;
        this.errorMessage = errorMessage;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
