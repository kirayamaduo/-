# Style Library (Vue / uni-app)

该目录是 C 端项目的组件库入口，用于统一声明“前端页面由组件库组件搭建”。

## 目录

- `components/`
  - `SlPage.vue` 页面容器
  - `SlSection.vue` 区块容器
  - `SlCard.vue` 卡片容器
  - `SlSectionTitle.vue` 区块标题
  - `SlIconButton.vue` 图标按钮
  - `SlButton.vue` 通用按钮
  - `SlListItem.vue` 列表项
  - `SlInput.vue` 输入框
  - `index.ts` 统一导出
- `styles/`
  - `index.css` 样式库统一入口
  - `tokens.css` 设计变量
  - `themes.css` 深色、护眼绿、字号档位
  - `base.css` 页面基础样式
  - `components.css` 通用组件类与 `Sl*` 组件基础样式
  - `mp-weixin.css` 微信小程序兼容覆盖

## 使用方式

```ts
import { SlCard, SlButton, SlInput } from '@/style-library/components';
```

全局样式由 `App.vue` 统一接入：

```css
@import '@/style-library/styles/index.css';
```

说明：
- 当前前端业务页面已完成，本组件库用于组件化归档与复用封装。
- 后续新页面/重构页面可优先从该目录取组件，维持统一口径。
- 页面重构时优先复用 `Sl*` 组件或 `app-*` / `ui-*` 通用类，避免在页面 scoped 样式中新增基础颜色、圆角、阴影、字号等硬编码值。
- 微信小程序端不要只依赖 scoped 样式中的 CSS 变量；需要跨端一致的基础视觉值应同步考虑 `styles/mp-weixin.css` 的 fallback 覆盖。
