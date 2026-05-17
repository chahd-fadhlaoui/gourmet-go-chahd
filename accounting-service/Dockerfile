FROM eclipse-temurin:19-jdk

WORKDIR /app

COPY target/accounting-service-1.0-SNAPSHOT.jar app.jar

EXPOSE 50053

ENTRYPOINT ["java", "-jar", "app.jar"]