import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import matter from "gray-matter";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const contentPath = resolve(__dirname, "src/content.json");
const notesPath = resolve(__dirname, "content/notes");
const noteTypes = new Set(["thinking", "learning", "reading"]);

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

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}

function getNoteFilePath(type: string, slug: string): string | null {
  if (!noteTypes.has(type) || !/^[a-z0-9-]+$/.test(slug)) return null;
  return resolve(notesPath, type, `${slug}.md`);
}

function getNoteDocument(parsed: matter.GrayMatterFile<string>) {
  const data = parsed.data as Record<string, unknown>;
  return {
    frontmatter: {
      title: typeof data.title === "string" ? data.title : "",
      status: typeof data.status === "string" ? data.status : "draft",
      date: normalizeDate(data.date),
      updated: normalizeDate(data.updated ?? data.date),
      summary: typeof data.summary === "string" ? data.summary : "",
      tags: toStringList(data.tags),
      related: toStringList(data.related),
      ...(typeof data.source === "string" ? { source: data.source } : {}),
      ...(typeof data.sourceUrl === "string" ? { sourceUrl: data.sourceUrl } : {}),
    },
    body: parsed.content.trim(),
  };
}

function isNoteDocumentShape(value: unknown): value is {
  frontmatter: {
    title: string;
    status: string;
    date: string;
    updated: string;
    summary: string;
    tags: string[];
    related: string[];
    source?: string;
    sourceUrl?: string;
  };
  body: string;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const frontmatter = candidate.frontmatter;
  if (!frontmatter || typeof frontmatter !== "object") return false;
  const data = frontmatter as Record<string, unknown>;
  return (
    typeof data.title === "string" &&
    (data.status === "draft" || data.status === "editing" || data.status === "published" || data.status === "archived") &&
    typeof data.date === "string" &&
    typeof data.updated === "string" &&
    typeof data.summary === "string" &&
    Array.isArray(data.tags) &&
    data.tags.every((item) => typeof item === "string") &&
    Array.isArray(data.related) &&
    data.related.every((item) => typeof item === "string") &&
    typeof candidate.body === "string" &&
    (data.source === undefined || typeof data.source === "string") &&
    (data.sourceUrl === undefined || typeof data.sourceUrl === "string")
  );
}

function localNotesApi() {
  return {
    name: "local-notes-api",
    configureServer(server) {
      server.middlewares.use("/api/notes", async (req, res) => {
        const path = new URL(req.url ?? "/", "http://localhost").pathname;
        const segments = path.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
        const [type, slug] = segments;
        const noteFilePath = segments.length === 2 ? getNoteFilePath(type, slug) : null;

        if (!noteFilePath) {
          res.statusCode = 400;
          res.end("Invalid note path");
          return;
        }

        if (req.method === "GET") {
          try {
            const rawContent = await readFile(noteFilePath, "utf-8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(getNoteDocument(matter(rawContent))));
          } catch {
            res.statusCode = 404;
            res.end("Note not found");
          }
          return;
        }

        if (req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsed = JSON.parse(body) as unknown;
              if (!isNoteDocumentShape(parsed)) {
                res.statusCode = 400;
                res.end("Invalid note document shape");
                return;
              }

              const frontmatter = {
                title: parsed.frontmatter.title,
                status: parsed.frontmatter.status,
                date: parsed.frontmatter.date,
                updated: parsed.frontmatter.updated,
                summary: parsed.frontmatter.summary,
                tags: parsed.frontmatter.tags,
                related: parsed.frontmatter.related,
                ...(parsed.frontmatter.source ? { source: parsed.frontmatter.source } : {}),
                ...(parsed.frontmatter.sourceUrl ? { sourceUrl: parsed.frontmatter.sourceUrl } : {}),
              };
              const serialized = matter.stringify(`\n${parsed.body.trim()}`, frontmatter)
                .replace(/^(date|updated): ['"](\d{4}-\d{2}-\d{2})['"]$/gm, "$1: $2");
              await writeFile(noteFilePath, `${serialized.trimEnd()}\n`, "utf-8");
              res.statusCode = 204;
              res.end();
            } catch {
              res.statusCode = 400;
              res.end("Invalid note document");
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
    plugins: mode === "edit" ? [react(), localContentApi(), localNotesApi()] : [react()],
  };
});
