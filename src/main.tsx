import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import contentData from "./content.json";
import { DigitalGarden } from "./components/DigitalGarden";
import type { GardenNote, GardenNoteDocument, SiteContent } from "./types";
import "./styles.css";

const content = contentData as SiteContent;

function App() {
  const editable = useMemo(() => new URLSearchParams(window.location.search).get("edit") === "1", []);
  const [theme, setTheme] = useState<"light" | "dark">(() => document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const [documents, setDocuments] = useState<Record<string, GardenNoteDocument>>({});

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("garden-theme", theme);
  }, [theme]);

  async function loadNote(note: GardenNote) {
    const key = `${note.type}/${note.slug}`;
    if (documents[key] || !editable) return;
    const response = await fetch(`/api/notes/${note.type}/${note.slug}`);
    if (response.ok) {
      const document = await response.json() as GardenNoteDocument;
      setDocuments((current) => ({ ...current, [key]: document }));
    }
  }

  async function saveNote(note: GardenNote, document: GardenNoteDocument) {
    const key = `${note.type}/${note.slug}`;
    setDocuments((current) => ({ ...current, [key]: document }));
    if (!editable) return false;
    const response = await fetch(`/api/notes/${note.type}/${note.slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(document) });
    return response.ok;
  }

  return <DigitalGarden content={content} editable={editable} theme={theme} onThemeToggle={() => setTheme((current) => current === "light" ? "dark" : "light")} documents={documents} onLoadNote={loadNote} onSaveNote={saveNote} />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
