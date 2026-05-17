package org.orchestrator;

import com.gourmet.accounting.*;
import com.gourmet.kitchen.*;
import com.gourmet.order.*;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

public class SagaWorkflow {

    public static String process(String orderId, double amount) {

        ManagedChannel orderChannel = ManagedChannelBuilder
                .forAddress("order-service", 50051)
                .usePlaintext()
                .build();

        ManagedChannel kitchenChannel = ManagedChannelBuilder
                .forAddress("kitchen-service", 50052)
                .usePlaintext()
                .build();

        ManagedChannel accountingChannel = ManagedChannelBuilder
                .forAddress("accounting-service", 50053)
                .usePlaintext()
                .build();

        OrderServiceGrpc.OrderServiceBlockingStub orderStub =
                OrderServiceGrpc.newBlockingStub(orderChannel);

        KitchenServiceGrpc.KitchenServiceBlockingStub kitchenStub =
                KitchenServiceGrpc.newBlockingStub(kitchenChannel);

        AccountingServiceGrpc.AccountingServiceBlockingStub accountingStub =
                AccountingServiceGrpc.newBlockingStub(accountingChannel);

        try {

            // STEP 1 -> Order Pending

            orderStub.updateStatus(
                    UpdateStatusRequest.newBuilder()
                            .setOrderId(orderId)
                            .setStatus("PENDING_KITCHEN")
                            .build()
            );

            // STEP 2 -> Create kitchen ticket

            TicketResponse kitchenResp = kitchenStub.createTicket(
                    TicketRequest.newBuilder()
                            .setOrderId(orderId)
                            .build()
            );

            if (!kitchenResp.getSuccess()) {

                orderStub.updateStatus(
                        UpdateStatusRequest.newBuilder()
                                .setOrderId(orderId)
                                .setStatus("REJECTED")
                                .build()
                );

                return "REJECTED";
            }

            // STEP 3 -> Payment authorization

            AuthorizeResponse authResp = accountingStub.authorizeCard(
                    AuthorizeRequest.newBuilder()
                            .setOrderId(orderId)
                            .setAmount(amount)
                            .build()
            );

            // PAYMENT FAILED -> COMPENSATION

            if (!authResp.getAuthorized()) {

                kitchenStub.rejectTicket(
                        RejectRequest.newBuilder()
                                .setOrderId(orderId)
                                .build()
                );

                orderStub.updateStatus(
                        UpdateStatusRequest.newBuilder()
                                .setOrderId(orderId)
                                .setStatus("REJECTED")
                                .build()
                );

                return "REJECTED";
            }

            // STEP 4 -> Approve kitchen ticket

            kitchenStub.approveTicket(
                    ApproveRequest.newBuilder()
                            .setOrderId(orderId)
                            .build()
            );

            // STEP 5 -> Final approval

            orderStub.updateStatus(
                    UpdateStatusRequest.newBuilder()
                            .setOrderId(orderId)
                            .setStatus("APPROVED")
                            .build()
            );

            return "APPROVED";

        } catch (Exception e) {

            e.printStackTrace();

            return "REJECTED";

        } finally {

            orderChannel.shutdown();
            kitchenChannel.shutdown();
            accountingChannel.shutdown();
        }
    }
}