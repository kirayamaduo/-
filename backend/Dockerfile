# =====================================================================
# Multi-stage build for the CareerLoop Spring Boot backend.
#
# Stage 1 (build): Maven + JDK 17 to produce the executable jar.
# Stage 2 (runtime): a minimal JRE 17 image — no Maven, no source, no
# build cache. Keeps the final image well under 250 MB.
#
# The image runs as an unprivileged user, exposes :8080, and starts in
# the `prod` Spring profile so it picks up application-prod.yml.
# =====================================================================

# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Cache the Maven download layer separately so a code-only change doesn't
# force re-resolving every dependency.
COPY pom.xml .
RUN mkdir -p /root/.m2 \
 && printf '%s\n' \
    '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">' \
    '  <mirrors>' \
    '    <mirror>' \
    '      <id>aliyunmaven</id>' \
    '      <mirrorOf>central</mirrorOf>' \
    '      <name>Aliyun Maven Central Mirror</name>' \
    '      <url>https://maven.aliyun.com/repository/central</url>' \
    '    </mirror>' \
    '  </mirrors>' \
    '</settings>' \
    > /root/.m2/settings.xml
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests \
 && cp target/*.jar /workspace/app.jar


# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install WQY MicroHei font for CJK (Chinese/Japanese/Korean) PDF rendering.
# openhtmltopdf falls back to '#' glyphs when no CJK font is present.
RUN apt-get update \
 && apt-get install -y --no-install-recommends fonts-wqy-microhei \
 && rm -rf /var/lib/apt/lists/*

# Run as a non-root user — limits blast radius if the JVM ever gets RCE'd.
RUN groupadd --system careerloop && useradd --system --gid careerloop careerloop

COPY --from=build --chown=careerloop:careerloop /workspace/app.jar /app/app.jar

USER careerloop

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 \
               -Djava.security.egd=file:/dev/./urandom \
               -Duser.timezone=Asia/Shanghai"
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

# Use a healthcheck instead of a separate sidecar so docker-compose / ECS
# can flip a service to unhealthy without external tooling.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
