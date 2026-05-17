package org.order;

import com.gourmet.order.OrderServiceGrpc;
import com.gourmet.order.UpdateStatusRequest;
import com.gourmet.order.UpdateStatusResponse;
import io.grpc.stub.StreamObserver;

public class OrderServiceImpl extends OrderServiceGrpc.OrderServiceImplBase {

    private final OrderRepository repository = new OrderRepository();

    @Override
    public void updateStatus(UpdateStatusRequest request,
                             StreamObserver<UpdateStatusResponse> responseObserver) {

        repository.updateStatus(request.getOrderId(), request.getStatus());

        UpdateStatusResponse response = UpdateStatusResponse.newBuilder()
                .setAcknowledged(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}