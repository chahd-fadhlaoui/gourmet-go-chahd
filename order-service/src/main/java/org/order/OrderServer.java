package org.order;

import io.grpc.Server;
import io.grpc.ServerBuilder;

import java.io.IOException;

public class OrderServer {

    public static void main(String[] args) throws IOException, InterruptedException {

        final int PORT = 50051;

        OrderRepository repository = new OrderRepository();
        while (true) {
            try {
                repository.createTableIfNotExists();
                break;
            } catch (Exception e) {
                System.out.println("DB not ready, retrying...");
                Thread.sleep(2000);
            }
        }

        Server server = ServerBuilder.forPort(PORT)
                .addService(new OrderServiceImpl())
                .build();

        server.start();

        System.out.println("Order-Service started on port " + PORT);

        server.awaitTermination();
    }
}