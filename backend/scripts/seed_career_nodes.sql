-- =====================================================================
-- Seed: populate career_nodes descriptions + estimated_hours
-- Run once with:
--   mysql -u root -p career_db < backend/scripts/seed_career_nodes.sql
-- Idempotent: re-running just overwrites the same rows.
-- =====================================================================

UPDATE career_nodes
SET description='掌握变量、流程控制、面向对象、集合、泛型和异常处理，这是后续学习的基础。',
    estimated_hours=80
WHERE node_id=1;

UPDATE career_nodes
SET description='使用 Spring Boot 构建 REST API，覆盖依赖注入、MVC、JPA、事务和基础错误处理。',
    estimated_hours=60
WHERE node_id=2;

UPDATE career_nodes
SET description='设计规范化表结构，编写高效 SQL，理解索引、事务和隔离级别。',
    estimated_hours=40
WHERE node_id=3;

UPDATE career_nodes
SET description='学习服务发现、网关、熔断、分布式配置，以及微服务在规模化场景下的通信方式。',
    estimated_hours=70
WHERE node_id=4;

UPDATE career_nodes
SET description='学习语义化标签、现代 CSS 布局、响应式设计和基础可访问性。',
    estimated_hours=40
WHERE node_id=5;

UPDATE career_nodes
SET description='掌握 ES2015+、async/await、事件循环、模块系统和 DOM API。',
    estimated_hours=60
WHERE node_id=6;

UPDATE career_nodes
SET description='学习 Composition API、响应式系统、单文件组件、Pinia、Vue Router 和 Vite 构建工具。',
    estimated_hours=70
WHERE node_id=7;

-- Verify
SELECT node_id, name, level, parent_id, LEFT(description, 60) AS preview, estimated_hours
FROM career_nodes ORDER BY path_id, sort_order, node_id;
