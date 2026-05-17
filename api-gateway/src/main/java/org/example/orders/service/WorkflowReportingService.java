package org.example.orders.service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.example.orders.dto.OrderStatusDTO;
import org.example.orders.dto.SagaStepDTO;
import org.example.orders.dto.WorkflowOrderDTO;
import org.example.orders.dto.WorkflowOverviewDTO;
import org.example.orders.dto.WorkflowPaymentDTO;
import org.example.orders.dto.WorkflowTicketDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WorkflowReportingService {

    private final String orderUrl;
    private final String orderUser;
    private final String orderPassword;
    private final String kitchenUrl;
    private final String kitchenUser;
    private final String kitchenPassword;
    private final String accountingUrl;
    private final String accountingUser;
    private final String accountingPassword;

    public WorkflowReportingService(
            @Value("${workflow.databases.order.url}") String orderUrl,
            @Value("${workflow.databases.order.username}") String orderUser,
            @Value("${workflow.databases.order.password}") String orderPassword,
            @Value("${workflow.databases.kitchen.url}") String kitchenUrl,
            @Value("${workflow.databases.kitchen.username}") String kitchenUser,
            @Value("${workflow.databases.kitchen.password}") String kitchenPassword,
            @Value("${workflow.databases.accounting.url}") String accountingUrl,
            @Value("${workflow.databases.accounting.username}") String accountingUser,
            @Value("${workflow.databases.accounting.password}") String accountingPassword) {
        this.orderUrl = orderUrl;
        this.orderUser = orderUser;
        this.orderPassword = orderPassword;
        this.kitchenUrl = kitchenUrl;
        this.kitchenUser = kitchenUser;
        this.kitchenPassword = kitchenPassword;
        this.accountingUrl = accountingUrl;
        this.accountingUser = accountingUser;
        this.accountingPassword = accountingPassword;
    }

    public WorkflowOverviewDTO getWorkflowOverview() {
        List<WorkflowOrderDTO> orders = loadOrders();
        List<WorkflowTicketDTO> tickets = loadTickets();
        List<WorkflowPaymentDTO> payments = loadPayments();

        Map<String, Integer> statusCounts = new HashMap<>();
        for (WorkflowOrderDTO order : orders) {
            statusCounts.put(order.getStatus(), statusCounts.getOrDefault(order.getStatus(), 0) + 1);
        }

        return new WorkflowOverviewDTO(statusCounts, orders, tickets, payments);
    }

    public OrderStatusDTO findOrderStatus(String orderId) {
        OrderSnapshot orderSnapshot = loadOrderSnapshot(orderId);
        if (orderSnapshot == null) {
            return null;
        }

        TicketSnapshot ticketSnapshot = loadTicketSnapshot(orderId);
        PaymentSnapshot paymentSnapshot = loadPaymentSnapshot(orderId);

        List<SagaStepDTO> steps = buildSagaSteps(orderSnapshot, ticketSnapshot, paymentSnapshot);
        String sagaFlow = determineSagaFlow(orderSnapshot, ticketSnapshot, paymentSnapshot);
        String lastEvent = steps.isEmpty() ? orderSnapshot.status : steps.get(steps.size() - 1).getLabel();

        return new OrderStatusDTO(
                orderId,
                orderSnapshot.status,
                lastEvent,
            preferTimestamp(orderSnapshot.createdAtMillis, orderSnapshot.updatedAtMillis),
                sagaFlow,
                steps);
    }

    private OrderSnapshot loadOrderSnapshot(String orderId) {
        String sql = "SELECT order_id, status, created_at, updated_at FROM orders WHERE order_id = ?";

        try (Connection connection = openConnection(orderUrl, orderUser, orderPassword);
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, orderId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                        return new OrderSnapshot(
                            resultSet.getString("order_id"),
                            resultSet.getString("status"),
                            toMillis(resultSet.getTimestamp("created_at")),
                            toMillis(resultSet.getTimestamp("updated_at")));
                }
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to load order status", ex);
        }

        return null;
    }

    private TicketSnapshot loadTicketSnapshot(String orderId) {
        String sql = "SELECT order_id, status, created_at, updated_at FROM tickets WHERE order_id = ?";

        try (Connection connection = openConnection(kitchenUrl, kitchenUser, kitchenPassword);
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, orderId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                        return new TicketSnapshot(
                            resultSet.getString("order_id"),
                            resultSet.getString("status"),
                            toMillis(resultSet.getTimestamp("created_at")),
                            toMillis(resultSet.getTimestamp("updated_at")));
                }
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to load kitchen status", ex);
        }

        return null;
    }

    private PaymentSnapshot loadPaymentSnapshot(String orderId) {
        String sql = "SELECT order_id, amount, authorized, created_at, updated_at FROM payments WHERE order_id = ?";

        try (Connection connection = openConnection(accountingUrl, accountingUser, accountingPassword);
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, orderId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                        return new PaymentSnapshot(
                            resultSet.getString("order_id"),
                            resultSet.getDouble("amount"),
                            resultSet.getBoolean("authorized"),
                            toMillis(resultSet.getTimestamp("created_at")),
                            toMillis(resultSet.getTimestamp("updated_at")));
                }
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to load accounting status", ex);
        }

        return null;
    }

    private List<SagaStepDTO> buildSagaSteps(OrderSnapshot order, TicketSnapshot ticket, PaymentSnapshot payment) {
        List<SagaStepDTO> steps = new ArrayList<>();
        steps.add(step("order-created", "Order Created", "Order Service", "Create order",
            "Order was created in the order service", "completed", "📦", order.createdAtMillis, null));

        if (ticket != null) {
            String ticketStatus = safeUpper(ticket.status);
            String ticketState = "PENDING".equals(ticketStatus) ? "running" : "completed";
                steps.add(step("kitchen-ticket", "Kitchen Ticket Created",
                    "Kitchen Service", "Create kitchen ticket",
                    "Kitchen service created the ticket", ticketState, "👨‍🍳", ticket.createdAtMillis, null));
        }

        if (payment != null) {
                if (payment.authorized) {
                steps.add(step("payment-approved", "Payment Approved",
                    "Accounting Service", "Approve payment",
                    "Accounting service approved the payment", "completed", "💳", payment.createdAtMillis,
                    null));
            } else {
                steps.add(step("payment-failed", "Payment Failed",
                    "Accounting Service", "Refuse payment",
                    "Accounting service refused the payment", "failed", "❌", payment.createdAtMillis,
                    "Payment authorization failed: amount exceeds policy threshold"));

                if (ticket != null) {
                    String ticketStatus = safeUpper(ticket.status);
                    String compensationState = "REJECTED".equals(ticketStatus) ? "compensated" : "running";
                        steps.add(step("kitchen-compensation", "Kitchen Compensation Triggered",
                            "Kitchen Service", "Reject / cancel ticket",
                            "Kitchen service is rolling back the ticket", compensationState, "↩️",
                            preferTimestamp(ticket.createdAtMillis, ticket.updatedAtMillis), null));

                    if ("REJECTED".equals(ticketStatus)) {
                        steps.add(step("ticket-rejected", "Ticket Rejected / Cancelled",
                            "Kitchen Service", "Cancel ticket",
                            "Kitchen ticket was rejected or cancelled", "compensated", "↩️",
                            preferTimestamp(ticket.createdAtMillis, ticket.updatedAtMillis), null));
                    }
                }
            }
        }

        String orderStatus = safeUpper(order.status);
        if ("APPROVED".equals(orderStatus) || "REJECTED".equals(orderStatus)) {
            String finalDescription = "APPROVED".equals(orderStatus)
                    ? "Order service finalized the saga as APPROVED"
                    : "Order service finalized the saga as REJECTED";
            String finalIcon = "APPROVED".equals(orderStatus) ? "✅" : "❌";
            steps.add(step("order-finalized", "Order Finalized → " + orderStatus,
                    "Order Service", "Finalize order",
                    finalDescription, "completed", finalIcon, preferTimestamp(order.createdAtMillis, order.updatedAtMillis), null));
        }

        // sort steps by timestamp ascending (chronological)
        steps.sort((a, b) -> Long.compare(a.getTimestamp() == null ? 0L : a.getTimestamp(), b.getTimestamp() == null ? 0L : b.getTimestamp()));

        return steps;
    }

    private String determineSagaFlow(OrderSnapshot order, TicketSnapshot ticket, PaymentSnapshot payment) {
        String orderStatus = safeUpper(order.status);
        if ("APPROVED".equals(orderStatus)) {
            return "HAPPY_PATH";
        }
        if (payment != null && !payment.authorized) {
            return "COMPENSATION_PATH";
        }
        if (ticket != null && "REJECTED".equals(safeUpper(ticket.status))) {
            return "COMPENSATION_PATH";
        }
        return "IN_PROGRESS";
    }

    private SagaStepDTO step(String id, String label, String service, String action, String description, String status,
            String icon, Long timestamp, String errorMessage) {
        return new SagaStepDTO(id, label, service, action, description, status, icon, timestamp, errorMessage);
    }

    private String safeUpper(String value) {
        return value == null ? "" : value.toUpperCase();
    }

    private long preferTimestamp(long createdAtMillis, long updatedAtMillis) {
        return updatedAtMillis > 0 ? updatedAtMillis : createdAtMillis;
    }

    private List<WorkflowOrderDTO> loadOrders() {
        String sql = "SELECT order_id, status, created_at, updated_at FROM orders ORDER BY updated_at DESC LIMIT 25";
        List<WorkflowOrderDTO> rows = new ArrayList<>();

        try (Connection connection = openConnection(orderUrl, orderUser, orderPassword);
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                rows.add(new WorkflowOrderDTO(
                    resultSet.getString("order_id"),
                    resultSet.getString("status"),
                    toMillis(resultSet.getTimestamp("updated_at"))));
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to load order workflow rows", ex);
        }

        return rows;
    }

    private List<WorkflowTicketDTO> loadTickets() {
        String sql = "SELECT order_id, status, created_at, updated_at FROM tickets ORDER BY updated_at DESC LIMIT 25";
        List<WorkflowTicketDTO> rows = new ArrayList<>();

        try (Connection connection = openConnection(kitchenUrl, kitchenUser, kitchenPassword);
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                rows.add(new WorkflowTicketDTO(
                    resultSet.getString("order_id"),
                    resultSet.getString("status"),
                    toMillis(resultSet.getTimestamp("updated_at"))));
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to load kitchen workflow rows", ex);
        }

        return rows;
    }

    private List<WorkflowPaymentDTO> loadPayments() {
        String sql = "SELECT order_id, amount, authorized, created_at, updated_at FROM payments ORDER BY updated_at DESC LIMIT 25";
        List<WorkflowPaymentDTO> rows = new ArrayList<>();

        try (Connection connection = openConnection(accountingUrl, accountingUser, accountingPassword);
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                rows.add(new WorkflowPaymentDTO(
                    resultSet.getString("order_id"),
                    resultSet.getDouble("amount"),
                    resultSet.getBoolean("authorized"),
                    toMillis(resultSet.getTimestamp("updated_at"))));
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to load accounting workflow rows", ex);
        }

        return rows;
    }

    private Connection openConnection(String url, String username, String password) throws SQLException {
        return DriverManager.getConnection(url, username, password);
    }

    private long toMillis(java.sql.Timestamp timestamp) {
        return timestamp == null ? 0L : timestamp.getTime();
    }

    private static final class OrderSnapshot {
        private final String orderId;
        private final String status;
        private final long createdAtMillis;
        private final long updatedAtMillis;

        private OrderSnapshot(String orderId, String status, long createdAtMillis, long updatedAtMillis) {
            this.orderId = orderId;
            this.status = status;
            this.createdAtMillis = createdAtMillis;
            this.updatedAtMillis = updatedAtMillis;
        }
    }

    private static final class TicketSnapshot {
        private final String orderId;
        private final String status;
        private final long createdAtMillis;
        private final long updatedAtMillis;

        private TicketSnapshot(String orderId, String status, long createdAtMillis, long updatedAtMillis) {
            this.orderId = orderId;
            this.status = status;
            this.createdAtMillis = createdAtMillis;
            this.updatedAtMillis = updatedAtMillis;
        }
    }

    private static final class PaymentSnapshot {
        private final String orderId;
        private final double amount;
        private final boolean authorized;
        private final long createdAtMillis;
        private final long updatedAtMillis;

        private PaymentSnapshot(String orderId, double amount, boolean authorized, long createdAtMillis, long updatedAtMillis) {
            this.orderId = orderId;
            this.amount = amount;
            this.authorized = authorized;
            this.createdAtMillis = createdAtMillis;
            this.updatedAtMillis = updatedAtMillis;
        }
    }
}