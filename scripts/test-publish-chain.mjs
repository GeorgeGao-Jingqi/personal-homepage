import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { runQuartzBuild } from "./build-quartz.mjs"

const root = resolve(import.meta.dirname, "..")
const tempRoot = await mkdtemp(resolve(tmpdir(), "personal-garden-chain-"))
const contentDir = resolve(tempRoot, "content")
const outputDir = resolve(tempRoot, "public")
const git = (...args) => {
  const result = spawnSync("git", args, { cwd: tempRoot, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`)
  return result.stdout
}

try {
  const workflow = await readFile(resolve(root, ".github/workflows/pages.yml"), "utf8")
  assert.match(workflow, /branches:\s*\[main\]/)
  assert.match(workflow, /submodules:\s*recursive/)
  assert.match(workflow, /npm --prefix quartz ci/)
  assert.match(workflow, /npm run build/)
  assert.match(workflow, /actions\/deploy-pages@v4/)

  await mkdir(contentDir, { recursive: true })
  await writeFile(resolve(contentDir, "index.md"), "---\ntitle: 测试花园\npublish: true\n---\n\n测试入口\n")
  await writeFile(resolve(contentDir, "published-note.md"), "---\ntitle: 已发布测试\npublish: true\ntags: [测试]\n---\n\n第一版内容\n")
  await writeFile(resolve(contentDir, "draft-note.md"), "---\ntitle: 草稿测试\npublish: false\n---\n\n不应公开\n")

  git("init", "-q")
  git("config", "user.email", "test@example.com")
  git("config", "user.name", "Quartz chain test")
  git("add", ".")
  git("commit", "-qm", "test: initial markdown")

  await runQuartzBuild({ contentDir, outputDir })
  assert.match(await readFile(resolve(outputDir, "published-note.html"), "utf8"), /第一版内容/)
  assert.equal(existsSync(resolve(outputDir, "draft-note.html")), false)

  await writeFile(resolve(contentDir, "published-note.md"), "---\ntitle: 已发布测试\npublish: true\ntags: [测试]\n---\n\n修改后的内容\n")
  git("add", ".")
  git("commit", "-qm", "docs: update published note")
  assert.equal(git("rev-list", "--count", "HEAD").trim(), "2")

  await runQuartzBuild({ contentDir, outputDir })
  assert.match(await readFile(resolve(outputDir, "published-note.html"), "utf8"), /修改后的内容/)
  console.log("✓ 本地 Markdown 修改 → Git commit → Quartz 重建：通过")
  console.log("✓ publish: false 内容未进入公开产物：通过")
  console.log("✓ 推送 main → GitHub Actions → Pages 发布配置：通过")
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}
