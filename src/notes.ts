import { Buffer } from "buffer";
import matter from "gray-matter";
import type { GardenNote, NoteKind, NoteStatus } from "./types";

if (typeof globalThis.Buffer === "undefined") {
  Object.assign(globalThis, { Buffer });
}

const rawNoteFiles = import.meta.glob("../content/notes/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function getSlug(filePath: string): string {
  return filePath.split("/").pop()?.replace(/\.md$/, "") ?? "note";
}

function getType(filePath: string): NoteKind | null {
  const folder = filePath.split("/").at(-2);
  return folder === "thinking" || folder === "learning" || folder === "reading" ? folder : null;
}

function getStatus(value: unknown): NoteStatus | null {
  return value === "draft" || value === "editing" || value === "published" || value === "archived" ? value : null;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}

function parseNote(filePath: string, rawContent: string): GardenNote | null {
  const parsed = matter(rawContent);
  const data = parsed.data as Record<string, unknown>;
  const slug = getSlug(filePath);
  const type = getType(filePath);
  const status = getStatus(data.status);
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const summary = typeof data.summary === "string" ? data.summary.trim() : "";
  const date = normalizeDate(data.date);
  const updated = normalizeDate(data.updated ?? data.date);

  if (!type || !status || typeof data.publish !== "boolean" || !title || !summary || !date || !updated || !Array.isArray(data.tags) || !Array.isArray(data.related)) return null;

  return {
    slug,
    type,
    status,
    publish: data.publish,
    title,
    summary,
    date,
    updated,
    tags: toStringList(data.tags),
    related: toStringList(data.related),
    source: typeof data.source === "string" ? data.source : undefined,
    sourceUrl: typeof data.sourceUrl === "string" ? data.sourceUrl : undefined,
    body: parsed.content.trim(),
  };
}

export const notes: GardenNote[] = Object.entries(rawNoteFiles)
  .map(([filePath, rawContent]) => parseNote(filePath, rawContent))
  .filter((note): note is GardenNote => note !== null)
  .sort((left, right) => right.updated.localeCompare(left.updated));

export function getPublicNotes(): GardenNote[] {
  return notes.filter((note) => note.status === "published");
}

export function getNotesByKind(kind: NoteKind): GardenNote[] {
  return getPublicNotes().filter((note) => note.type === kind);
}

export function findNote(slug: string): GardenNote | undefined {
  return notes.find((note) => note.slug === slug && note.status !== "draft" && note.status !== "archived");
}

export function findRelatedNotes(note: GardenNote): GardenNote[] {
  const publicNotes = getPublicNotes();
  const explicit = note.related.map((slug) => publicNotes.find((candidate) => candidate.slug === slug)).filter(Boolean) as GardenNote[];
  const inferred = publicNotes.filter(
    (candidate) => candidate.slug !== note.slug && candidate.tags.some((tag) => note.tags.includes(tag)),
  );
  return [...explicit, ...inferred.filter((candidate) => !explicit.some((item) => item.slug === candidate.slug))].slice(0, 3);
}

export function getAllTags(): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const note of getPublicNotes()) {
    for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, count]) => ({ name, count }));
}
