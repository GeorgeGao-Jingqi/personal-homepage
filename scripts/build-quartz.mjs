import { existsSync } from "node:fs"
import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const root = resolve(fileURLToPath(import.meta.url), "../..")

export async function runQuartzBuild({ contentDir, outputDir }) {
  const quartzSource = resolve(root, "quartz/quartz")
  const cli = resolve(root, "quartz/quartz/bootstrap-cli.mjs")
  if (!existsSync(cli)) {
    throw new Error("Quartz 子模块未初始化，请先运行：git submodule update --init --recursive")
  }

  const workspace = await mkdtemp(resolve(tmpdir(), "personal-quartz-build-"))
  const sourceCache = resolve(quartzSource, ".quartz-cache")
  try {
    await rm(sourceCache, { recursive: true, force: true })
    await cp(quartzSource, resolve(workspace, "quartz"), { recursive: true })
    await symlink(resolve(root, "quartz/node_modules"), resolve(workspace, "node_modules"), "dir")
    await symlink(resolve(workspace, "quartz/.quartz-cache"), sourceCache, "dir")
    await symlink(resolve(root, "quartz.config.ts"), resolve(workspace, "quartz.config.ts"))
    await symlink(resolve(root, "quartz.layout.ts"), resolve(workspace, "quartz.layout.ts"))
    await writeFile(resolve(workspace, "package.json"), JSON.stringify({ version: "4.5.2" }))

    const result = spawnSync(
      process.execPath,
      [cli, "build", "--directory", resolve(contentDir), "--output", resolve(outputDir)],
      { cwd: workspace, stdio: "inherit", env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? "" } },
    )
    if (result.status !== 0) throw new Error(`Quartz 构建失败（退出码 ${result.status ?? "未知"}）`)
  } finally {
    await rm(sourceCache, { recursive: true, force: true })
    await rm(workspace, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runQuartzBuild({
    contentDir: resolve(root, "content/notes"),
    outputDir: resolve(root, "dist/garden"),
  })
}
