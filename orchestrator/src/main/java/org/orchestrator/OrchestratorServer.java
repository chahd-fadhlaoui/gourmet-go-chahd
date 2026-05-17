package org.orchestrator;

import io.grpc.Server;
import io.grpc.ServerBuilder;

public class OrchestratorServer {

    public static void main(String[] args) throws Exception {

        Server server = ServerBuilder
                .forPort(50054)
                .addService(new OrchestratorServiceImpl())
                .build();

        server.start();

        System.out.println("🚀 Orchestrator running on port 50054");

        server.awaitTermination();
    }
}