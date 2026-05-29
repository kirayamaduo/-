#!/usr/bin/env bash
# 全员本机一次执行：把 origin 切到 GitHub，Gitee 保留为 gitee 只读备份。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GITHUB_URL="git@github.com:kirayamaduo/careerloop.git"
GITEE_URL="git@gitee.com:zy-cdut/2025-l5s4-group-1.git"

cd "$REPO_ROOT"

if git remote get-url origin 2>/dev/null | grep -q gitee.com; then
  git remote rename origin gitee
fi

if git remote get-url github 2>/dev/null; then
  git remote rename github origin
elif ! git remote get-url origin 2>/dev/null | grep -q github.com; then
  git remote add origin "$GITHUB_URL"
else
  git remote set-url origin "$GITHUB_URL"
fi

git remote add gitee "$GITEE_URL" 2>/dev/null || git remote set-url gitee "$GITEE_URL"

git fetch origin
git checkout master
git branch -u origin/master master
git pull origin master

echo ""
echo "Done. remotes:"
git remote -v
echo ""
echo "master tracks origin/master (GitHub). Push with: git push origin <branch>"
