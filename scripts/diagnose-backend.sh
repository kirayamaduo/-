#!/usr/bin/env bash
# =============================================================
# CareerLoop — 后端启动失败诊断脚本
# 在服务器 (jumpuser@129.28.97.93) 的 backend/ 目录下运行：
#   chmod +x scripts/diagnose-backend.sh
#   bash scripts/diagnose-backend.sh
# =============================================================
set -euo pipefail

BACKEND_CONTAINER="careerloop-backend"
MYSQL_CONTAINER="careerloop-mysql"

echo "======================================================"
echo "  CareerLoop 后端诊断"
echo "======================================================"

# 1. 容器状态
echo ""
echo "── 1. 容器当前状态 ──────────────────────────────────"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
    | grep -E "NAME|careerloop" || true

# 2. 后端日志（最后 80 行，着重看 ERROR / Exception）
echo ""
echo "── 2. 后端容器日志（最后 80 行）────────────────────"
docker logs "${BACKEND_CONTAINER}" --tail 80 2>&1 || \
    echo "  [!] 容器不存在或无法读取日志"

# 3. 特别检查 Flyway 错误
echo ""
echo "── 3. Flyway 错误检索 ──────────────────────────────"
docker logs "${BACKEND_CONTAINER}" 2>&1 | \
    grep -i -E "flyway|checksum|validate|migration|FlywayException" | \
    tail -20 || echo "  [✓] 未发现 Flyway 关键字（可能容器未曾启动）"

# 4. 检查 .env.prod 是否存在及关键变量
echo ""
echo "── 4. .env.prod 关键变量检查 ───────────────────────"
if [ -f .env.prod ]; then
    echo "  [✓] .env.prod 存在"
    # 检查必须有值的变量
    for VAR in MYSQL_ROOT_PASSWORD MYSQL_USER MYSQL_PWD JWT_SECRET \
               OSS_ACCESS_KEY_ID OSS_ACCESS_KEY_SECRET ALIYUN_AI_API_KEY; do
        VAL=$(grep -E "^${VAR}=" .env.prod 2>/dev/null | cut -d= -f2- | tr -d '[:space:]')
        if [ -z "${VAL}" ]; then
            echo "  [✗] ${VAR} 为空 ← 必须填写！"
        else
            echo "  [✓] ${VAR} 已设置"
        fi
    done
else
    echo "  [✗] .env.prod 不存在！请从 .env.prod.example 复制并填写"
fi

# 5. Flyway 历史表（如果 MySQL 在运行）
echo ""
echo "── 5. Flyway 迁移历史 ──────────────────────────────"
MYSQL_PWD_VAL=""
if [ -f .env.prod ]; then
    MYSQL_PWD_VAL=$(grep "^MYSQL_ROOT_PASSWORD=" .env.prod | cut -d= -f2-)
fi
if docker ps --format '{{.Names}}' | grep -q "${MYSQL_CONTAINER}"; then
    docker exec "${MYSQL_CONTAINER}" \
        mysql -uroot -p"${MYSQL_PWD_VAL}" career_db 2>/dev/null \
        -e "SELECT version, description, success, checksum FROM flyway_schema_history ORDER BY installed_rank;" \
        2>/dev/null || echo "  [!] 无法连接 MySQL（密码错误或 DB 不存在）"
else
    echo "  [!] MySQL 容器未运行，跳过"
fi

echo ""
echo "======================================================"
echo "  诊断完成。将上面的输出发给 AI 分析。"
echo "======================================================"
