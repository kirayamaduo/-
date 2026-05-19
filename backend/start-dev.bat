@echo off
set JWT_SECRET=careerloop-dev-secret-key-for-local-development-only-32bytes
set OSS_ACCESS_KEY_ID=dummy
set OSS_ACCESS_KEY_SECRET=dummy
set ALIYUN_AI_API_KEY=dummy
set WECHAT_SECRET=dummy
set REDIS_PASSWORD=
set BODY_LANG_ENABLED=false
set CONTENT_SAFETY_ENABLED=false
set AI_FALLBACK_MODE=true

java -jar "E:\Projects\careerloop\-\backend\target\career-backend-0.0.1-SNAPSHOT.jar" --spring.profiles.active=demo --spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration
