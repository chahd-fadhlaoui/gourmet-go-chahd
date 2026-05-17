FROM eclipse-temurin:19-jdk

WORKDIR /app

COPY target/order-service-1.0-SNAPSHOT.jar app.jar

EXPOSE 50051

ENTRYPOINT ["java", "-jar", "app.jar"]