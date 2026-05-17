package org.accounting;

import com.gourmet.accounting.*;
import io.grpc.stub.StreamObserver;

public class AccountingServiceImpl extends AccountingServiceGrpc.AccountingServiceImplBase {

    private final AccountingRepository repository = new AccountingRepository();

    @Override
    public void authorizeCard(AuthorizeRequest request,
                              StreamObserver<AuthorizeResponse> responseObserver) {

        boolean authorized =
                repository.authorizePayment(
                        request.getOrderId(),
                        request.getAmount()
                );

        AuthorizeResponse response = AuthorizeResponse.newBuilder()
                .setAuthorized(authorized)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}