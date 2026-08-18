# AGENTS.md

## 项目概览

这是一个数据分析师个人主页，用作简历补充。项目基于 React + Vite + TypeScript，支持中英双语、页面内编辑、模拟 AI 对话入口，并通过 GitHub Actions 部署到 GitHub Pages。

线上页面是纯静态站点。只有本地运行 `npm run edit` 时，`?edit=1` 页面才会连接本地编辑 API，把内容写回 `src/content.json`。

## 参考主页与风格要求

- Brittany Chiang：https://brittanychiang.com/。参考其面向招聘的叙事结构：清晰职业定位、成长与经历背景、项目证据、技术标签和联系入口逐层展开。本站的项目表达优先使用“问题 / 方法 / 影响”，避免只堆技术名词。
- Brittany Chiang 旧版：https://v3.brittanychiang.com/。参考其简洁一页式招聘页面、强首屏、锚点导航和项目列表节奏，但不要复制配色、布局或代码。
- Matthew Woods：https://matthewwoods.org/。参考其清爽、现代、克制但有工程感的页面风格：大面积留白、清晰卡片、代码或终端式小元素、指标卡、明确 CTA 和响应式项目展示。
- Lee Robinson：https://leerob.com/。补充参考其内容优先、文字克制、阅读友好的个人主页节奏。未来增加文章、学习日志或思考记录时，可以借鉴这种信息密度。
- Joshua Wilson Data Analyst Portfolio：https://joshua-wilson-portfolio.github.io/。补充参考其数据分析师项目分类方式，包括 Python、SQL、Tableau、Power BI、Excel 等能力入口；本站应保持更精炼的招聘叙事和更高视觉完成度。

整体风格应保持“个人品牌数据实验室”：视觉上接近 Matthew Woods 的清爽现代感，叙事上吸收 Brittany Chiang 的招聘表达方式。继续使用当前 React + Vite + TypeScript 技术栈，不因为参考站点使用 Next.js、Tailwind、Firebase 或 Vercel 而迁移框架。指标卡使用可编辑占位内容，未确认前不要虚构真实业绩。

## 数字花园维护规则

- 数字花园使用 `content/notes/` 下的 Markdown 文件作为长期知识内容来源，分为 `thinking/`、`learning/`、`reading/` 三类。
- 每篇笔记需要包含 YAML frontmatter：`title`、`status`、`date`、`updated`、`summary`、`tags`、`related`；阅读笔记可增加 `source` 和 `sourceUrl`。
- `status` 使用 `draft`、`editing`、`published`、`archived`。线上默认只展示 `published` 和 `editing`，不要把草稿放入公开导航或搜索结果。
- 笔记通过构建时 `import.meta.glob` 收集，并由 `gray-matter` 解析；不要在前端引入真实数据库或写入 API。
- 数字花园页面使用 Hash 路由，需兼容 GitHub Pages 子路径；新增页面时同步检查首页、笔记详情、标签页、搜索和移动端导航。
- v1 笔记通过文件编辑维护，`?edit=1` 仍只负责编辑 `src/content.json` 中的主页资料，不扩展为在线 Markdown 编辑器。

## 常用命令

- `npm run dev`：启动普通 Vite 预览。
- `npm run edit`：启动本地编辑后台，访问 `http://127.0.0.1:<port>/?edit=1` 后，页面修改会写入 `src/content.json`。
- `npm run build`：运行 TypeScript 检查并生成生产构建。
- `npm run preview`：预览 `npm run build` 生成的生产版本。

## 重要文件

- `src/content.json`：主页内容的唯一来源，包括 `zh` / `en` 两套文案、项目、技能、经历、联系方式和 AI 对话介绍。
- `src/types.ts`：内容结构类型定义。调整 `src/content.json` 结构时必须同步更新这里。
- `src/main.tsx`：页面渲染、语言切换、编辑模式、保存逻辑和模拟 AI 回复逻辑。
- `src/components/`：页面区块和通用编辑组件，包括首屏、故事、项目、技能、经历、联系、聊天和可编辑字段。
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
