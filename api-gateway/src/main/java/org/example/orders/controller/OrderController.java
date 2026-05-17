package org.example.orders.controller;

import org.example.orders.dto.CreateOrderRequestDTO;
import org.example.orders.dto.CreateOrderResponseDTO;
import org.example.orders.dto.OrderStatusDTO;
import org.example.orders.dto.WorkflowOverviewDTO;
import org.example.orders.service.WorkflowReportingService;
import org.example.shared.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gourmet.orchestrator.CreateOrderRequest;
import com.gourmet.orchestrator.CreateOrderResponse;
import com.gourmet.orchestrator.OrchestratorServiceGrpc;

import io.grpc.StatusRuntimeException;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrchestratorServiceGrpc.OrchestratorServiceBlockingStub orchestratorStub;
    private final WorkflowReportingService workflowReportingService;

    public OrderController(OrchestratorServiceGrpc.OrchestratorServiceBlockingStub orchestratorStub,
            WorkflowReportingService workflowReportingService) {
        this.orchestratorStub = orchestratorStub;
        this.workflowReportingService = workflowReportingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreateOrderResponseDTO>> createOrder(
            @Valid @RequestBody CreateOrderRequestDTO request) {

        logger.info("Creating order with amount: {}", request.getAmount());

        try {
            CreateOrderResponse response = orchestratorStub.createOrder(
                    CreateOrderRequest.newBuilder()
                            .setAmount(request.getAmount())
                            .build());

            CreateOrderResponseDTO responseDTO = new CreateOrderResponseDTO(
                    response.getOrderId(),
                    response.getStatus(),
                    request.getAmount());

            logger.info("Order created successfully: {} with status: {}",
                    response.getOrderId(), response.getStatus());

            HttpStatus statusCode = response.getStatus().equals("APPROVED")
                    ? HttpStatus.CREATED
                    : HttpStatus.OK;

            return ResponseEntity.status(statusCode)
                    .body(ApiResponse.success(responseDTO, "Order created successfully"));

        } catch (StatusRuntimeException e) {
            logger.error("gRPC error while creating order", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("SERVICE_UNAVAILABLE",
                            "Orchestration service is unavailable"));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderStatusDTO>> getOrderStatus(@PathVariable("orderId") String orderId) {
        logger.info("Fetching status for order: {}", orderId);

        if (orderId == null || orderId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_ORDER_ID", "Order ID cannot be empty"));
        }

        OrderStatusDTO status;
        try {
            status = workflowReportingService.findOrderStatus(orderId);
        } catch (Exception ex) {
            logger.warn("Failed to read order status from workflow DB", ex);
            status = null;
        }

        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ORDER_NOT_FOUND", "No workflow data found for order"));
        }

        return ResponseEntity.ok()
                .body(ApiResponse.success(status, "Order status"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<WorkflowOverviewDTO>> getDashboard() {
        logger.info("Fetching workflow dashboard summary");

        WorkflowOverviewDTO overview = workflowReportingService.getWorkflowOverview();
        return ResponseEntity.ok().body(ApiResponse.success(overview, "Workflow dashboard"));
    }

    @GetMapping("/workflow")
    public ResponseEntity<ApiResponse<WorkflowOverviewDTO>> getWorkflowOverview() {
        logger.info("Fetching full workflow overview");

        WorkflowOverviewDTO overview = workflowReportingService.getWorkflowOverview();
        return ResponseEntity.ok().body(ApiResponse.success(overview, "Workflow overview"));
    }
}