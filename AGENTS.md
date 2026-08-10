# AGENTS.md

## 项目概览

这是一个数据分析师个人主页，用作简历补充。项目基于 React + Vite + TypeScript，支持中英双语、页面内编辑、模拟 AI 对话入口，并通过 GitHub Actions 部署到 GitHub Pages。

线上页面是纯静态站点。只有本地运行 `npm run edit` 时，`?edit=1` 页面才会连接本地编辑 API，把内容写回 `src/content.json`。

## 常用命令

- `npm run dev`：启动普通 Vite 预览。
- `npm run edit`：启动本地编辑后台，访问 `http://127.0.0.1:<port>/?edit=1` 后，页面修改会写入 `src/content.json`。
- `npm run build`：运行 TypeScript 检查并生成生产构建。
- `npm run preview`：预览 `npm run build` 生成的生产版本。

## 重要文件

- `src/content.json`：主页内容的唯一来源，包括 `zh` / `en` 两套文案、项目、技能、经历、联系方式和 AI 对话介绍。
- `src/types.ts`：内容结构类型定义。调整 `src/content.json` 结构时必须同步更新这里。
- `src/main.tsx`：页面渲染、语言切换、编辑模式、保存逻辑和模拟 AI 回复逻辑。
- `src/styles.css`：全部页面样式和响应式布局。
- `assets/hero-workspace.png`：首屏视觉图，通过模块导入参与 Vite 构建，适配 GitHub Pages 子路径。
- `vite.config.ts`：Vite 配置；`edit` mode 下注册本地 `/api/content` 读写接口；GitHub Actions 中自动设置 Pages 子路径 `base`。
- `.github/workflows/pages.yml`：GitHub Pages 部署流程，push 到 `main` 后执行 `npm ci`、`npm run build` 并发布 `dist/`。

## 维护规则

- 不要提交 `node_modules/`、`dist/`、`*.tsbuildinfo`、`vite.config.js` 或 `vite.config.d.ts`。
- 修改主页文案时，优先改 `src/content.json`；如果通过页面编辑，必须使用 `npm run edit`，普通 `npm run dev` 只会回退到浏览器缓存。
- 修改内容结构时，同步更新 `src/types.ts`、编辑 UI 和本地 `/api/content` 的基本校验。
- 修改 GitHub Pages、资源路径或构建配置后，必须运行 `npm run build`。
- 线上 GitHub Pages 不应暴露写入 API、后台管理能力或任何密钥。
- 模拟 AI 对话目前在 `src/main.tsx` 的 `getAiReply` 中实现；接入真实 AI API 时，应新增后端或 serverless 层，不要把 API key 放进前端代码。

## 验证清单

- 内容变更：运行 `npm run build`，并在本地确认中英切换和 AI 对话仍能使用。
- 编辑功能变更：运行 `npm run edit`，访问 `?edit=1`，修改一处文案后确认 `src/content.json` 发生变化。
- 部署相关变更：确认 GitHub Actions workflow 仍发布 `dist/`，并检查 GitHub Pages 链接下首屏图和静态资源正常加载。
