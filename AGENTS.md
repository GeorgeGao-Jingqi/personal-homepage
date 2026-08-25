# AGENTS.md

## 项目概览

这是一个可本地编辑的中文个人简介+个人知识库+摄影作品集。项目使用 React + Vite + TypeScript，通过 GitHub Actions 部署到 GitHub Pages；线上永远是只读静态站点。

普通模式只公开 `published` 的笔记和摄影作品。只有本地运行 `npm run edit` 并访问 `?edit=1` 时，页面才允许创建/编辑内容与上传图片；所有写入均回到仓库文件，必须经 Git 提交后发布。

知识花园由 `content/notes/` 下的 Markdown 驱动，生产环境只由 Vite/React 构建，统一在主页 Hash 路由中展示；线上不再生成或提供 `/garden/`。Quartz v4.5.2 子模块和 `build:quartz` 仅作为备用静态构建工具保留，不参与 GitHub Pages 生产构建。

## 内容规则

- Markdown 笔记位于 `content/notes/<thinking|learning|reading>/`，frontmatter 必填：`title`、`status`、`date`、`updated`、`summary`、`tags`、`related`；可选 `source`、`sourceUrl`。
- 状态仅可为 `draft`、`editing`、`published`、`archived`。生产环境只展示 `published`；编辑模式可查看全部状态。
- Quartz 备用构建使用显式发布规则：公开笔记必须有 `publish: true`，`draft`、`editing` 和 `archived` 必须使用 `publish: false`；缺少该字段的笔记不会进入 Quartz 备用产物。React 主页同时只展示 `status: published`。
- 摄影专题元数据位于 `content/photos/albums/*.json`，照片元数据位于 `content/photos/items/*.json`。照片必填 `slug`、`album`、`status`、`title`、`date`、`location`、`tags`、`description`、`alt`、`image`、`thumbnail`、`width`、`height`。
- 图片存放于 `public/photos/<album>/<slug>/`。上传流程生成 `image.webp` 与 `thumb.webp`；列表页面必须使用缩略图和 `srcset`，所有图片都必须有准确的 `alt`。
- 不要虚构公开笔记、摄影作品、拍摄地点或相机参数。没有真实内容时保留空状态。

## Obsidian 到 Git 发布流程

- 当用户明确说“发布笔记”“同步 Obsidian 到主页”“提交笔记”或表达同等意图时，执行本节流程：先检查并展示待发布的笔记差异，再只提交确认范围内的 `content/notes/` 文件，推送到 `main`，最后报告提交、远程分支和 GitHub Pages 构建状态。不要把本地未确认的 `AGENTS.md`、`content/.obsidian/` 或其他无关文件带入提交。
- Obsidian 直接打开 `content/notes/` 作为 Vault；不要把 `quartz/` 子模块目录作为日常写作目录。
- 在 `thinking/`、`learning/` 或 `reading/` 下新建 Markdown 文件，并保留完整 frontmatter。准备公开时设置 `status: published` 和 `publish: true`；草稿、编辑中或归档内容使用 `publish: false`。
- Obsidian 本身只负责修改本地文件。Obsidian Sync 不会触发 GitHub Pages，必须在项目根目录执行 Git 操作：

  ```bash
  cd "/Users/gaojingqi/Documents/ChatGPT/个人主页"
  git status --short
  git diff -- content/notes
  git switch main
  git pull --ff-only origin main
  git add content/notes
  git diff --cached --stat
  git commit -m "docs: update notes"
  git push origin main
  ```

- 推送到 `main` 后，`.github/workflows/pages.yml` 会自动安装依赖、运行 Vite/React 构建并发布 Pages；不需要手动运行 Quartz 或上传 HTML 文件。Quartz 只在明确需要备用静态花园时手动运行 `npm run build:quartz`。
- `git add content/notes` 只用于确认要发布整个笔记目录的情况；若只发布单篇笔记，改为 `git add content/notes/<category>/<slug>.md`。暂存后必须检查 `git diff --cached`，确认没有草稿、`.obsidian/` 配置或无关文件。若只想保存草稿，也可以提交，但必须保持 `publish: false`。
- 如果已有未提交改动导致无法切换 `main`，不要使用强制切换、重置或清理；先保留现场并向用户报告，等待确认后再继续。
- 如需使用备用 Quartz 构建，首次初始化子模块后运行 `git submodule update --init --recursive` 和 `npm --prefix quartz ci`，再运行 `npm run build:quartz`；日常只编辑 Markdown 和执行 Git 提交即可。

## 视觉规则

- 当前字体保持 Inter / 系统中文无衬线字体栈，除非用户明确要求，不要更换或引入字体文件。
- 亮色 token：背景 `#f6f4ef`、正文 `#2d2d2d`、标题 `#1c1c1c`、次要文字 `#777570`、分隔线 `#e3e0d7`、浅底 `#edeae1`、朱红 `#b13a25`、金色 `#9c7a2c`。
- 暗色 token：背景 `#121212`、正文 `#d9d7d0`、标题 `#e8e6e0`、次要文字 `#8e8c85`、分隔线 `#262626`、浅底 `#1c1c1c`、朱红 `#cf5f45`、金色 `#cba24a`。
- 墨色用于正文和结构；朱红只用于当前状态、焦点和关键操作；金色只用于次级元信息。摄影图片保持原始色彩，不施加主题混色。

## 重要文件

- `src/content.json`：站点中英界面文案与联系信息。
- `src/notes.ts`、`src/photos.ts`：构建时读取并校验内容。
- `src/components/DigitalGarden.tsx`：Hash 路由、知识库、摄影展示和本地编辑表单。
- `vite.config.ts`：仅 edit mode 注册 `/api/notes` 和 `/api/photos` 本地写入接口。
- `src/styles.css`：主题 token、布局与响应式样式。
- `quartz/`：锁定的 Quartz v4.5.2 子模块；不要直接在子模块内改代码。
- `quartz.config.ts`、`quartz.layout.ts`：本站知识花园的 Quartz 颜色、字体、显式发布过滤器和页面布局。
- `scripts/build-quartz.mjs`：备用构建时在临时工作区调用 Quartz，避免污染子模块源码。
- `scripts/test-publish-chain.mjs`：验证 Markdown 修改、Git commit、Vite 生产构建、公开状态筛选和无 `/garden` 产物。

## 常用命令与验证

- `npm run dev`：普通只读预览。
- `npm run edit`：本地编辑、创建笔记和上传照片；线上不能使用这些接口。
- `npm run build`：TypeScript 检查和生产构建。
- 首次拉取仓库后运行 `git submodule update --init --recursive` 和 `npm --prefix quartz ci`。
- `npm run build:quartz`：手动生成备用 Quartz 静态花园，不参与生产 Pages 构建。
- `npm run test:publish-chain`：测试本地 Markdown 修改 → Git commit → Vite 构建的最小闭环；真实 GitHub 推送仍由用户执行，推送到 `main` 才会触发 Pages 发布。
- 内容或样式修改后运行 `npm run build`；编辑能力变更后验证创建笔记、编辑笔记、上传 JPEG/PNG/WebP、非法 slug/缺失 alt 的失败提示，以及公开模式不泄露非 published 内容。
- 同时检查亮暗主题持久化、键盘焦点、桌面与 390px 移动布局、Hash 路由和 GitHub Pages 子路径资源加载。
- 不要提交 `node_modules/`、`dist/`、`*.tsbuildinfo`、`vite.config.js` 或 `vite.config.d.ts`。
