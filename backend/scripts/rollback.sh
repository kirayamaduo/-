#!/usr/bin/env bash
# F23: One-command rollback to the previous backend image.
# Usage: ./scripts/rollback.sh
set -euo pipefail

SERVER_USER="${DEPLOY_USER:-jumpuser}"
SERVER_HOST="${DEPLOY_HOST:-129.28.97.93}"
SERVER_DIR="${DEPLOY_DIR:-/home/jumpuser/careerloop/2025-l5s4-group-1}"

echo "========================================"
echo " CareerLoop Backend ROLLBACK"
echo " Target: ${SERVER_USER}@${SERVER_HOST}"
echo "========================================"
echo ""
read -rp "Rolling back to :rollback image. Confirm? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

ssh "${SERVER_USER}@${SERVER_HOST}" "
  cd ${SERVER_DIR}/backend
  echo '[rollback] Switching :rollback → :latest'
  docker tag careerloop-backend:rollback careerloop-backend:latest
  echo '[rollback] Restarting backend container'
  docker compose up -d --no-deps --force-recreate app
  sleep 8
  STATUS=\$(docker inspect --format='{{.State.Health.Status}}' careerloop-backend 2>/dev/null || echo 'unknown')
  echo \"[rollback] Container status: \${STATUS}\"
"

echo ""
echo "✅ Rollback applied. Monitor with:"
echo "   ssh ${SERVER_USER}@${SERVER_HOST} 'docker logs careerloop-backend --tail 50 -f'"
