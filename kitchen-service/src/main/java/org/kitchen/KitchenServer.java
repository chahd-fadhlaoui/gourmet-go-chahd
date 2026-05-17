package org.kitchen;

import io.grpc.Server;
import io.grpc.ServerBuilder;

import java.io.IOException;

public class KitchenServer {

    public static void main(String[] args) throws IOException, InterruptedException {
        final int PORT = 50052;

        KitchenRepository repository = new KitchenRepository();
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
                .addService(new KitchenServiceImpl())
                .build();

        server.start();

        System.out.println("🍳 Kitchen Service running on port " + PORT);

        server.awaitTermination();
    }
}