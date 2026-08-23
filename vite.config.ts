import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import matter from "gray-matter";
import sharp from "sharp";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = __dirname;
const notesRoot = resolve(root, "content/notes");
const photosRoot = resolve(root, "content/photos");
const publicPhotosRoot = resolve(root, "public/photos");
const types = new Set(["thinking", "learning", "reading"]);
const statuses = new Set(["draft", "editing", "published", "archived"]);
const safeSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const date = () => new Date().toISOString().slice(0, 10);

function send(res: import("node:http").ServerResponse, status: number, body = "", contentType = "text/plain; charset=utf-8") { res.statusCode = status; res.setHeader("Content-Type", contentType); res.end(body); }
async function body(req: import("node:http").IncomingMessage) { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); return Buffer.concat(chunks); }
function list(value: unknown) { return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : []; }
function validDocument(value: unknown): value is { frontmatter: Record<string, unknown>; body: string } { if (!value || typeof value !== "object") return false; const item = value as { frontmatter?: Record<string, unknown>; body?: unknown }; const data = item.frontmatter; return Boolean(data && typeof data.title === "string" && typeof data.summary === "string" && typeof data.date === "string" && typeof data.updated === "string" && statuses.has(String(data.status)) && list(data.tags) && list(data.related) && typeof item.body === "string"); }
function notePath(type: string, slug: string) { return types.has(type) && safeSlug(slug) ? resolve(notesRoot, type, `${slug}.md`) : null; }
function documentFromFile(raw: string) { const parsed = matter(raw); const data = parsed.data as Record<string, unknown>; return { frontmatter: { title: String(data.title ?? ""), status: String(data.status ?? "draft"), date: String(data.date ?? ""), updated: String(data.updated ?? data.date ?? ""), summary: String(data.summary ?? ""), tags: Array.isArray(data.tags) ? data.tags.map(String) : [], related: Array.isArray(data.related) ? data.related.map(String) : [], ...(typeof data.source === "string" ? { source: data.source } : {}), ...(typeof data.sourceUrl === "string" ? { sourceUrl: data.sourceUrl } : {}) }, body: parsed.content.trim() }; }

function multipart(buffer: Buffer, contentType: string) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] ?? contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) throw new Error("Invalid multipart request");
  const fields = new Map<string, string>(); let file: { name: string; type: string; data: Buffer } | undefined;
  for (const part of buffer.toString("binary").split(`--${boundary}`).slice(1, -1)) {
    const [rawHeaders, rawValue = ""] = part.replace(/^\r\n/, "").split("\r\n\r\n"); const name = rawHeaders.match(/name="([^"]+)"/)?.[1]; if (!name) continue;
    const value = Buffer.from(rawValue.replace(/\r\n$/, ""), "binary"); const filename = rawHeaders.match(/filename="([^"]*)"/)?.[1]; const type = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] ?? "";
    if (filename) file = { name: filename, type, data: value }; else fields.set(name, value.toString("utf8"));
  }
  return { fields, file };
}

function localApi() {
  return { name: "local-garden-api", configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use("/api/notes", async (req, res) => {
      const parts = new URL(req.url ?? "/", "http://localhost").pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if (req.method === "POST" && parts.length === 0) { try { const input = JSON.parse((await body(req)).toString()) as { type?: string; slug?: string; title?: string }; const path = notePath(input.type ?? "", input.slug ?? ""); if (!path || !input.title?.trim()) return send(res, 400, "分类、slug 或标题无效"); try { await stat(path); return send(res, 409, "该 slug 已存在"); } catch {} const today = date(); const raw = matter.stringify("\n", { title: input.title.trim(), status: "draft", date: today, updated: today, summary: "", tags: [], related: [] }); await writeFile(path, raw, "utf8"); return send(res, 201, JSON.stringify({ ok: true }), "application/json"); } catch { return send(res, 400, "无法创建笔记"); } }
      const [type, slug] = parts; const path = notePath(type, slug); if (!path) return send(res, 400, "无效笔记路径");
      if (req.method === "GET") { try { return send(res, 200, JSON.stringify(documentFromFile(await readFile(path, "utf8"))), "application/json"); } catch { return send(res, 404, "笔记不存在"); } }
      if (req.method === "PUT") { try { const input = JSON.parse((await body(req)).toString()); if (!validDocument(input)) return send(res, 400, "笔记内容无效"); const frontmatter = { ...input.frontmatter, tags: list(input.frontmatter.tags), related: list(input.frontmatter.related) }; const raw = matter.stringify(`\n${input.body.trim()}\n`, frontmatter).replace(/^(date|updated): ['"](\d{4}-\d{2}-\d{2})['"]$/gm, "$1: $2"); await writeFile(path, raw, "utf8"); return send(res, 204); } catch { return send(res, 400, "无法保存笔记"); } }
      return send(res, 405, "Method Not Allowed");
    });
    server.middlewares.use("/api/photos", async (req, res) => {
      if (req.method !== "POST") return send(res, 405, "Method Not Allowed");
      try { const { fields, file } = multipart(await body(req), String(req.headers["content-type"] ?? "")); const album = fields.get("album") ?? ""; const slug = fields.get("slug") ?? ""; const title = fields.get("title")?.trim() ?? ""; const alt = fields.get("alt")?.trim() ?? ""; const location = fields.get("location")?.trim() ?? ""; const photoDate = fields.get("date") ?? ""; if (!safeSlug(album) || !safeSlug(slug) || !file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !title || !alt || !location || !/^\d{4}-\d{2}-\d{2}$/.test(photoDate)) return send(res, 400, "请填写有效元数据并上传 JPEG、PNG 或 WebP 图片"); const metaPath = resolve(photosRoot, "items", `${album}-${slug}.json`); try { await stat(metaPath); return send(res, 409, "该摄影 slug 已存在"); } catch {} const outputDir = resolve(publicPhotosRoot, album, slug); await mkdir(outputDir, { recursive: true }); const image = await sharp(file.data).rotate(); const metadata = await image.metadata(); if (!metadata.width || !metadata.height) return send(res, 400, "无法读取图片尺寸"); await image.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 88 }).toFile(resolve(outputDir, "image.webp")); await image.resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toFile(resolve(outputDir, "thumb.webp")); await mkdir(resolve(photosRoot, "albums"), { recursive: true }); try { await stat(resolve(photosRoot, "albums", `${album}.json`)); } catch { await writeFile(resolve(photosRoot, "albums", `${album}.json`), JSON.stringify({ slug: album, title: fields.get("albumTitle")?.trim() || album, description: fields.get("albumDescription")?.trim() || "", date: photoDate, location, order: Date.now() }, null, 2) + "\n"); } const photo = { slug, album, status: "draft", title, date: photoDate, location, tags: (fields.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), description: fields.get("description")?.trim() ?? "", alt, image: `/photos/${album}/${slug}/image.webp`, thumbnail: `/photos/${album}/${slug}/thumb.webp`, width: metadata.width, height: metadata.height }; await writeFile(metaPath, JSON.stringify(photo, null, 2) + "\n"); return send(res, 201, JSON.stringify({ album, slug }), "application/json"); } catch { return send(res, 400, "无法处理图片上传"); }
    });
  }};
}

export default defineConfig(({ mode }) => { const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1]; return { base: process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : "/", plugins: mode === "edit" ? [react(), localApi()] : [react()] }; });
