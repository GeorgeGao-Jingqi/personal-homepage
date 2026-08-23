# AGENTS.md

## 项目概览

这是一个可本地编辑的中文个人知识库与摄影作品集。项目使用 React + Vite + TypeScript，通过 GitHub Actions 部署到 GitHub Pages；线上永远是只读静态站点。

普通模式只公开 `published` 的笔记和摄影作品。只有本地运行 `npm run edit` 并访问 `?edit=1` 时，页面才允许创建/编辑内容与上传图片；所有写入均回到仓库文件，必须经 Git 提交后发布。

## 内容规则

- Markdown 笔记位于 `content/notes/<thinking|learning|reading>/`，frontmatter 必填：`title`、`status`、`date`、`updated`、`summary`、`tags`、`related`；可选 `source`、`sourceUrl`。
- 状态仅可为 `draft`、`editing`、`published`、`archived`。生产环境只展示 `published`；编辑模式可查看全部状态。
- 摄影专题元数据位于 `content/photos/albums/*.json`，照片元数据位于 `content/photos/items/*.json`。照片必填 `slug`、`album`、`status`、`title`、`date`、`location`、`tags`、`description`、`alt`、`image`、`thumbnail`、`width`、`height`。
- 图片存放于 `public/photos/<album>/<slug>/`。上传流程生成 `image.webp` 与 `thumb.webp`；列表页面必须使用缩略图和 `srcset`，所有图片都必须有准确的 `alt`。
- 不要虚构公开笔记、摄影作品、拍摄地点或相机参数。没有真实内容时保留空状态。

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

## 常用命令与验证

- `npm run dev`：普通只读预览。
- `npm run edit`：本地编辑、创建笔记和上传照片；线上不能使用这些接口。
- `npm run build`：TypeScript 检查和生产构建。
- 内容或样式修改后运行 `npm run build`；编辑能力变更后验证创建笔记、编辑笔记、上传 JPEG/PNG/WebP、非法 slug/缺失 alt 的失败提示，以及公开模式不泄露非 published 内容。
- 同时检查亮暗主题持久化、键盘焦点、桌面与 390px 移动布局、Hash 路由和 GitHub Pages 子路径资源加载。
- 不要提交 `node_modules/`、`dist/`、`*.tsbuildinfo`、`vite.config.js` 或 `vite.config.d.ts`。
