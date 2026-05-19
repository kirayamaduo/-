-- Localize existing seeded career paths and nodes for the Chinese mini-program UI.
-- Idempotent: only known English seed values are overwritten.

UPDATE career_paths
SET name = 'Java 后端工程师',
    description = '成为优秀的 Java 后端开发者，掌握 Spring Boot、微服务、数据库等核心技能。'
WHERE code = 'java-backend';

UPDATE career_paths
SET name = '前端工程师',
    description = '成为现代前端开发者，掌握 Vue、React、TypeScript 等主流技术栈。'
WHERE code = 'frontend-engineer';

UPDATE career_nodes
SET name = CASE name
    WHEN 'Java Basics' THEN 'Java 基础'
    WHEN 'Spring Boot Intro' THEN 'Spring Boot 入门'
    WHEN 'Database Design' THEN '数据库设计'
    WHEN 'Spring Cloud Microservices' THEN 'Spring Cloud 微服务'
    WHEN 'HTML/CSS Basics' THEN 'HTML/CSS 基础'
    WHEN 'JavaScript Core' THEN 'JavaScript 核心'
    WHEN 'Vue.js Framework' THEN 'Vue.js 框架'
    ELSE name
  END,
  description = CASE description
    WHEN 'Master variables, control flow, OOP, collections, generics, and exception handling. The bedrock for everything that follows.'
      THEN '掌握变量、流程控制、面向对象、集合、泛型和异常处理，这是后续学习的基础。'
    WHEN 'Build REST APIs with Spring Boot. Cover dependency injection, MVC, JPA, transactions, and basic error handling.'
      THEN '使用 Spring Boot 构建 REST API，覆盖依赖注入、MVC、JPA、事务和基础错误处理。'
    WHEN 'Design normalized schemas, write efficient SQL, understand indexes, transactions, and isolation levels.'
      THEN '设计规范化表结构，编写高效 SQL，理解索引、事务和隔离级别。'
    WHEN 'Service discovery, gateway, circuit breakers, distributed config, and how microservices communicate at scale.'
      THEN '学习服务发现、网关、熔断、分布式配置，以及微服务在规模化场景下的通信方式。'
    WHEN 'Semantic markup, modern CSS layouts (flexbox + grid), responsive design, and accessibility fundamentals.'
      THEN '学习语义化标签、现代 CSS 布局、响应式设计和基础可访问性。'
    WHEN 'ES2015+, async/await, the event loop, modules, and the DOM API. Skip nothing here.'
      THEN '掌握 ES2015+、async/await、事件循环、模块系统和 DOM API。'
    WHEN 'Composition API, reactivity, single-file components, Pinia state, Vue Router, and build tooling with Vite.'
      THEN '学习 Composition API、响应式系统、单文件组件、Pinia、Vue Router 和 Vite 构建工具。'
    ELSE description
  END
WHERE name IN (
    'Java Basics',
    'Spring Boot Intro',
    'Database Design',
    'Spring Cloud Microservices',
    'HTML/CSS Basics',
    'JavaScript Core',
    'Vue.js Framework'
  )
  OR description IN (
    'Master variables, control flow, OOP, collections, generics, and exception handling. The bedrock for everything that follows.',
    'Build REST APIs with Spring Boot. Cover dependency injection, MVC, JPA, transactions, and basic error handling.',
    'Design normalized schemas, write efficient SQL, understand indexes, transactions, and isolation levels.',
    'Service discovery, gateway, circuit breakers, distributed config, and how microservices communicate at scale.',
    'Semantic markup, modern CSS layouts (flexbox + grid), responsive design, and accessibility fundamentals.',
    'ES2015+, async/await, the event loop, modules, and the DOM API. Skip nothing here.',
    'Composition API, reactivity, single-file components, Pinia state, Vue Router, and build tooling with Vite.'
  );
