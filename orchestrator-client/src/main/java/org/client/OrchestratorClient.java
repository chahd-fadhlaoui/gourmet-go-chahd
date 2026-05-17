package org.client;

import com.gourmet.orchestrator.CreateOrderRequest;
import com.gourmet.orchestrator.CreateOrderResponse;
import com.gourmet.orchestrator.OrchestratorServiceGrpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

public class OrchestratorClient {

    public static void main(String[] args) {

        ManagedChannel channel = ManagedChannelBuilder
                .forAddress("localhost", 50054)
                .usePlaintext()
                .build();

        OrchestratorServiceGrpc.OrchestratorServiceBlockingStub stub =
                OrchestratorServiceGrpc.newBlockingStub(channel);

        CreateOrderResponse response =
                stub.createOrder(
                        CreateOrderRequest.newBuilder()
                                .setAmount(120)
                                .build()
                );

        System.out.println("Order ID: " + response.getOrderId());
        System.out.println("Final Status: " + response.getStatus());

        channel.shutdown();
    }
}