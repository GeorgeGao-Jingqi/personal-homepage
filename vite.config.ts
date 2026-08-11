import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const contentPath = resolve(__dirname, "src/content.json");

function hasContentShape(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const content = value as Record<string, unknown>;
  return ["zh", "en"].every((language) => {
    const profile = content[language];
    if (!profile || typeof profile !== "object") return false;

    const candidate = profile as Record<string, unknown>;
    return (
      typeof candidate.name === "string" &&
      typeof candidate.role === "string" &&
      typeof candidate.tagline === "string" &&
      typeof candidate.intro === "string" &&
      typeof candidate.heroNote === "string" &&
      typeof candidate.storyAside === "string" &&
      typeof candidate.projectsIntro === "string" &&
      typeof candidate.skillsIntro === "string" &&
      typeof candidate.experienceNote === "string" &&
      typeof candidate.contactLead === "string" &&
      Array.isArray(candidate.metrics) &&
      Array.isArray(candidate.projects) &&
      Array.isArray(candidate.skills) &&
      Array.isArray(candidate.experience) &&
      Array.isArray(candidate.contacts)
    );
  });
}

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
              if (!hasContentShape(parsed)) {
                res.statusCode = 400;
                res.end("Invalid content shape");
                return;
              }
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
