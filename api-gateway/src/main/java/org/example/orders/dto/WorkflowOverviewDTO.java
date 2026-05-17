package org.example.orders.dto;

import java.util.List;
import java.util.Map;

public class WorkflowOverviewDTO {
    private Map<String, Integer> statusCounts;
    private List<WorkflowOrderDTO> orders;
    private List<WorkflowTicketDTO> tickets;
    private List<WorkflowPaymentDTO> payments;

    public WorkflowOverviewDTO() {
    }

    public WorkflowOverviewDTO(Map<String, Integer> statusCounts,
            List<WorkflowOrderDTO> orders,
            List<WorkflowTicketDTO> tickets,
            List<WorkflowPaymentDTO> payments) {
        this.statusCounts = statusCounts;
        this.orders = orders;
        this.tickets = tickets;
        this.payments = payments;
    }

    public Map<String, Integer> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<String, Integer> statusCounts) {
        this.statusCounts = statusCounts;
    }

    public List<WorkflowOrderDTO> getOrders() {
        return orders;
    }

    public void setOrders(List<WorkflowOrderDTO> orders) {
        this.orders = orders;
    }

    public List<WorkflowTicketDTO> getTickets() {
        return tickets;
    }

    public void setTickets(List<WorkflowTicketDTO> tickets) {
        this.tickets = tickets;
    }

    public List<WorkflowPaymentDTO> getPayments() {
        return payments;
    }

    public void setPayments(List<WorkflowPaymentDTO> payments) {
        this.payments = payments;
    }
}
