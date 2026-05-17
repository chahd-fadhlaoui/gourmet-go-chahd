package org.orchestrator;

import com.gourmet.orchestrator.*;
import io.grpc.stub.StreamObserver;

import java.util.UUID;

public class OrchestratorServiceImpl
        extends OrchestratorServiceGrpc.OrchestratorServiceImplBase {

    @Override
    public void createOrder(
            CreateOrderRequest request,
            StreamObserver<CreateOrderResponse> responseObserver) {

        String orderId = "ORDER-" + UUID.randomUUID();

        double amount = request.getAmount();

        String finalStatus = SagaWorkflow.process(orderId, amount);

        CreateOrderResponse response =
                CreateOrderResponse.newBuilder()
                        .setOrderId(orderId)
                        .setStatus(finalStatus)
                        .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}