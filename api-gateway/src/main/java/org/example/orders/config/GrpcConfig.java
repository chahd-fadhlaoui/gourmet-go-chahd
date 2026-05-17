package org.example.orders.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.gourmet.orchestrator.OrchestratorServiceGrpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

@Configuration
public class GrpcConfig {

    @Value("${grpc.orchestrator.host:localhost}")
    private String orchestratorHost;

    @Value("${grpc.orchestrator.port:50054}")
    private int orchestratorPort;

    @Bean
    public ManagedChannel orchestratorChannel() {
        return ManagedChannelBuilder
                .forAddress(orchestratorHost, orchestratorPort)
                .usePlaintext()
                .build();
    }

    @Bean
    public OrchestratorServiceGrpc.OrchestratorServiceBlockingStub orchestratorStub(
            ManagedChannel orchestratorChannel) {
        return OrchestratorServiceGrpc.newBlockingStub(orchestratorChannel);
    }
}