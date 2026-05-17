FROM eclipse-temurin:19-jdk

WORKDIR /app

COPY target/kitchen-service-1.0-SNAPSHOT.jar app.jar

EXPOSE 50052

ENTRYPOINT ["java", "-jar", "app.jar"]