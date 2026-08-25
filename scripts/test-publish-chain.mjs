import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"
import matter from "gray-matter"

const root = resolve(import.meta.dirname, "..")
const tempRoot = await mkdtemp(resolve(tmpdir(), "personal-garden-chain-"))
const contentDir = resolve(tempRoot, "content/notes/thinking")

const git = (...args) => {
  const result = spawnSync("git", args, { cwd: tempRoot, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`)
  return result.stdout
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await markdownFiles(path))
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path)
  }
  return files
}

async function publicNotes(directory) {
  const files = await markdownFiles(directory)
  const result = []
  for (const file of files) {
    const parsed = matter(await readFile(file, "utf8"))
    if (parsed.data.status === "published" && parsed.data.publish === true) result.push(parsed.data)
  }
  return result
}

async function textFiles(directory) {
  if (!existsSync(directory)) return ""
  const entries = await readdir(directory, { withFileTypes: true })
  const chunks = []
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) chunks.push(await textFiles(path))
    else if (entry.isFile() && /\.(css|html|js|json|map|txt)$/.test(entry.name)) chunks.push(await readFile(path, "utf8"))
  }
  return chunks.join("\n")
}

try {
  const workflow = await readFile(resolve(root, ".github/workflows/pages.yml"), "utf8")
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))
  assert.match(workflow, /branches:\s*\[main\]/)
  assert.doesNotMatch(workflow, /submodules:\s*recursive/)
  assert.doesNotMatch(workflow, /npm --prefix quartz ci/)
  assert.match(workflow, /npm run build/)
  assert.match(workflow, /actions\/deploy-pages@v4/)
  assert.equal(packageJson.scripts.build, "tsc -b && vite build")
  assert.equal(packageJson.scripts["build:quartz"], "node scripts/build-quartz.mjs")

  await mkdir(contentDir, { recursive: true })
  await writeFile(resolve(contentDir, "published-note.md"), "---\ntitle: 已发布测试\nstatus: published\npublish: true\ndate: 2026-08-25\nupdated: 2026-08-25\nsummary: 已发布内容\ntags: [测试]\nrelated: []\n---\n\n第一版内容\n")
  await writeFile(resolve(contentDir, "draft-note.md"), "---\ntitle: 草稿测试\nstatus: draft\npublish: false\ndate: 2026-08-25\nupdated: 2026-08-25\nsummary: 草稿内容\ntags: []\nrelated: []\n---\n\n不应公开\n")
  await writeFile(resolve(contentDir, "editing-note.md"), "---\ntitle: 编辑中测试\nstatus: editing\npublish: false\ndate: 2026-08-25\nupdated: 2026-08-25\nsummary: 编辑中内容\ntags: []\nrelated: []\n---\n\n不应公开\n")
  await writeFile(resolve(contentDir, "archived-note.md"), "---\ntitle: 归档测试\nstatus: archived\npublish: false\ndate: 2026-08-25\nupdated: 2026-08-25\nsummary: 归档内容\ntags: []\nrelated: []\n---\n\n不应公开\n")

  git("init", "-q")
  git("config", "user.email", "test@example.com")
  git("config", "user.name", "Vite publish chain test")
  git("add", ".")
  git("commit", "-qm", "test: initial markdown")

  let selected = await publicNotes(resolve(tempRoot, "content/notes"))
  assert.deepEqual(selected.map((note) => note.title), ["已发布测试"])

  await writeFile(resolve(contentDir, "published-note.md"), "---\ntitle: 已发布测试\nstatus: published\npublish: true\ndate: 2026-08-25\nupdated: 2026-08-25\nsummary: 已发布内容\ntags: [测试]\nrelated: []\n---\n\n修改后的内容\n")
  git("add", ".")
  git("commit", "-qm", "docs: update published note")
  assert.equal(git("rev-list", "--count", "HEAD").trim(), "2")
  selected = await publicNotes(resolve(tempRoot, "content/notes"))
  assert.deepEqual(selected.map((note) => note.title), ["已发布测试"])
  assert.equal((await readFile(resolve(contentDir, "published-note.md"), "utf8")).includes("修改后的内容"), true)

  const build = spawnSync("npm", ["run", "build"], { cwd: root, encoding: "utf8", stdio: "inherit" })
  if (build.status !== 0) throw new Error("Vite 生产构建失败")
  assert.equal(existsSync(resolve(root, "dist/garden")), false)
  const currentPublic = await publicNotes(resolve(root, "content/notes"))
  assert.ok(currentPublic.length > 0, "当前仓库至少需要一篇 published 笔记")
  const builtText = await textFiles(resolve(root, "dist"))
  assert.ok(builtText.includes(String(currentPublic[0].title)), "公开笔记标题未进入 Vite 构建产物")

  console.log("✓ Markdown 修改 → Git commit：通过")
  console.log("✓ 仅 status: published 且 publish: true 进入公开内容：通过")
  console.log("✓ Vite 生产构建 → React 笔记内容进入 dist：通过")
  console.log("✓ 生产构建不生成 dist/garden：通过")
  console.log("✓ 推送 main → GitHub Actions → Pages 发布配置：通过")
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}
