FROM eclipse-temurin:19-jdk

WORKDIR /app

COPY target/orchestrator-1.0-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]