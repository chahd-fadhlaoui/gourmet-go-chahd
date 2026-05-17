package org.accounting;

import io.grpc.Server;
import io.grpc.ServerBuilder;

import java.io.IOException;

public class AccountingServer {

    public static void main(String[] args) throws IOException, InterruptedException {

        final int PORT = 50053;

        AccountingRepository repository = new AccountingRepository();

        while (true) {
            try {
                repository.createTableIfNotExists();
                break;
            } catch (Exception e) {
                System.out.println("DB not ready, retrying...");
                Thread.sleep(2000);
            }
        }

        Server server = ServerBuilder
                .forPort(PORT)
                .addService(new AccountingServiceImpl())
                .build();

        server.start();

        System.out.println("💳 Accounting Service running on port " + PORT);

        server.awaitTermination();
    }
}