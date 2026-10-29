# 1) Tailwind CSS 빌드
FROM node:20 AS css
WORKDIR /app
COPY . .
RUN npm install && npm run build

# 2) Spring Boot 빌드
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY --from=css /app .
RUN mvn -DskipTests package

# 3) 실행
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["sh", "-c", "java -Xmx350m -Dserver.port=${PORT:-8080} -jar app.jar"]
