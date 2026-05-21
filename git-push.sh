#!/bin/bash
cd "/Users/kira/Projects/IPD_Projects/2025-L5S4-Group 1"

# 1. 清理残留的 lock 文件
rm -f .git/index.lock

# 2. 创建新分支
git checkout -b feature/sync-profile-portrait-data

# 3. 添加所有改动并提交
git add -A
git commit -m "feat: 同步求职画像数据源 + 前端画像编辑/展示优化

后端:
- AgentProfileServiceImpl: saveInputs 保存时同步写回 profileSnapshot.onboarding
- UserProfileSnapshotServiceImpl: read 时从 UserFacts 补充 onboarding 空字段

前端:
- agent/profile.vue: 两套保存互刷、表单回填
- home/index.vue & user/index.vue: 引用公共过滤函数
- user/memory.vue: 图标 bug 修复
- api/agent.ts: 新增 getProfileInputsApi
- utils/profileTagFilters.ts: 公共标签过滤工具

admin-frontend: 已有的本地改动一并提交"

# 4. 推送到 Gitee
git push origin feature/sync-profile-portrait-data
