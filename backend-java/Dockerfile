# Stage 1: Build the application using Maven and Java 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Eclipse Temurin Java 21 JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/backend-java-1.0.0.jar app.jar

EXPOSE 8000

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8000} -jar app.jar"]
