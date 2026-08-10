import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const contentPath = resolve(__dirname, "src/content.json");

function localContentApi() {
  return {
    name: "local-content-api",
    configureServer(server) {
      server.middlewares.use("/api/content", async (req, res) => {
        if (req.method === "GET") {
          const content = await readFile(contentPath, "utf-8");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(content);
          return;
        }

        if (req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body);
              await writeFile(contentPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
              res.statusCode = 204;
              res.end();
            } catch {
              res.statusCode = 400;
              res.end("Invalid JSON");
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end("Method Not Allowed");
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  return {
    base: process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : "/",
    plugins: mode === "edit" ? [react(), localContentApi()] : [react()],
  };
});
