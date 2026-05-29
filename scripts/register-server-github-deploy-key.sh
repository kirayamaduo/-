#!/usr/bin/env bash
# 一次性：把服务器 Deploy Key 登记到 GitHub 后，验证服务器能 git pull。
set -euo pipefail

SERVER_USER="${DEPLOY_USER:-ubuntu}"
SERVER_HOST="${DEPLOY_HOST:-43.138.240.228}"
REPO="kirayamaduo/careerloop"

PUBKEY=$(ssh "${SERVER_USER}@${SERVER_HOST}" 'cat ~/.ssh/github_careerloop_deploy.pub')

echo "1) 打开 GitHub Deploy keys 页面并 Add deploy key："
echo "   https://github.com/${REPO}/settings/keys/new"
echo ""
echo "   Title: careerloop-server"
echo "   Allow write access: 不勾选（只读即可）"
echo ""
echo "2) 粘贴下面这一行公钥："
echo ""
echo "$PUBKEY"
echo ""
read -rp "3) 添加完成后按 Enter 继续验证… " _

ssh "${SERVER_USER}@${SERVER_HOST}" "
  set -e
  cd /home/ubuntu/careerloop
  git fetch origin
  git status -sb
  echo ''
  echo 'Server can reach GitHub origin.'
"
