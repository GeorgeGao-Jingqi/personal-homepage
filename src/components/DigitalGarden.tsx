import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { albums, findAlbum, findPhoto, getPublicPhotos, photos, photosForAlbum } from "../photos";
import { findNote, findRelatedNotes, getAllTags, getPublicNotes, notes } from "../notes";
import type { GardenNote, GardenNoteDocument, Language, NoteKind, Photo, SiteContent } from "../types";

type Route =
  | { kind: "home" } | { kind: "notes"; category?: NoteKind } | { kind: "note"; type: NoteKind; slug: string }
  | { kind: "tags" } | { kind: "tag"; tag: string } | { kind: "photos" } | { kind: "album"; album: string }
  | { kind: "photo"; album: string; slug: string } | { kind: "new-note" } | { kind: "new-photo" };

const kinds: NoteKind[] = ["thinking", "learning", "reading"];
const labels: Record<Language, Record<NoteKind, string>> = {
  zh: { thinking: "Thinking", learning: "Learning", reading: "Reading" },
  en: { thinking: "Thinking", learning: "Learning", reading: "Reading" },
};

function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return { kind: "home" };
  if (parts[0] === "notes" && kinds.includes(parts[1] as NoteKind) && parts[2]) return { kind: "note", type: parts[1] as NoteKind, slug: parts[2] };
  if (parts[0] === "notes") return { kind: "notes", category: kinds.includes(parts[1] as NoteKind) ? parts[1] as NoteKind : undefined };
  if (parts[0] === "tags" && parts[1]) return { kind: "tag", tag: parts[1] };
  if (parts[0] === "tags") return { kind: "tags" };
  if (parts[0] === "photos" && parts[1] && parts[2]) return { kind: "photo", album: parts[1], slug: parts[2] };
  if (parts[0] === "photos" && parts[1]) return { kind: "album", album: parts[1] };
  if (parts[0] === "photos") return { kind: "photos" };
  if (parts[0] === "new-note") return { kind: "new-note" };
  if (parts[0] === "new-photo") return { kind: "new-photo" };
  return { kind: "home" };
}

const notesHref = (kind?: NoteKind) => `#/notes${kind ? `/${kind}` : ""}`;
const noteHref = (note: GardenNote) => `#/notes/${note.type}/${encodeURIComponent(note.slug)}`;
const tagHref = (tag: string) => `#/tags/${encodeURIComponent(tag)}`;
const photoHref = (photo: Photo) => `#/photos/${photo.album}/${photo.slug}`;
const formatDate = (value: string) => value.replace(/-/g, ".");

export function DigitalGarden({ content, editable, theme, onThemeToggle, documents, onLoadNote, onSaveNote }: {
  content: SiteContent; editable: boolean; theme: "light" | "dark"; onThemeToggle: () => void;
  documents: Record<string, GardenNoteDocument>; onLoadNote: (note: GardenNote) => Promise<void>; onSaveNote: (note: GardenNote, document: GardenNoteDocument) => Promise<boolean>;
}) {
  const [language, setLanguage] = useState<Language>("zh");
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [query, setQuery] = useState("");
  const visibleNotes = editable ? notes : getPublicNotes();
  const visiblePhotos = editable ? photos : getPublicPhotos();
  const copy = content[language];
  useEffect(() => { const update = () => setRoute(parseRoute(window.location.hash)); addEventListener("hashchange", update); return () => removeEventListener("hashchange", update); }, []);
  const results = useMemo(() => !query.trim() ? [] : visibleNotes.filter((note) => `${note.title} ${note.summary} ${note.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6), [query, visibleNotes]);

  return <div className="garden-app">
    <aside className="garden-sidebar">
      <a className="garden-brand" href="#/"><span>GG</span><strong>{copy.title}</strong></a>
      <nav aria-label="主导航"><a href="#/" className={route.kind === "home" ? "active" : ""}>地图</a><a href={notesHref()} className={route.kind === "notes" || route.kind === "note" || route.kind === "tags" || route.kind === "tag" ? "active" : ""}>知识库</a>{kinds.map((kind) => <a key={kind} className="nav-indent" href={notesHref(kind)}>{labels[language][kind]} <small>{visibleNotes.filter((note) => note.type === kind).length}</small></a>)}<a href="#/photos" className={route.kind === "photos" || route.kind === "album" || route.kind === "photo" ? "active" : ""}>摄影 <small>{visiblePhotos.length}</small></a></nav>
      {editable && <div className="editor-actions"><a href="#/new-note">+ 新建笔记</a><a href="#/new-photo">+ 上传照片</a></div>}
      <div className="sidebar-bottom"><button onClick={onThemeToggle} aria-label="切换亮暗主题">{theme === "light" ? "墨" : "纸"}</button><button onClick={() => setLanguage((current) => current === "zh" ? "en" : "zh")}>{language === "zh" ? "EN" : "中"}</button><span>{editable ? "LOCAL EDIT" : "READ ONLY"}</span></div>
    </aside>
    <main className="garden-main">
      <header className="garden-topbar"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === "zh" ? "搜索笔记、标签或关键词" : "Search notes, tags, or words"} /></label>{results.length > 0 && <div className="search-results">{results.map((note) => <a key={note.slug} href={noteHref(note)} onClick={() => setQuery("")}>{note.title}<small>{labels[language][note.type]}</small></a>)}</div>}</header>
      <Page route={route} content={copy} language={language} editable={editable} visibleNotes={visibleNotes} visiblePhotos={visiblePhotos} documents={documents} onLoadNote={onLoadNote} onSaveNote={onSaveNote} />
    </main>
  </div>;
}

function Page({ route, content, language, editable, visibleNotes, visiblePhotos, documents, onLoadNote, onSaveNote }: { route: Route; content: SiteContent[Language]; language: Language; editable: boolean; visibleNotes: GardenNote[]; visiblePhotos: Photo[]; documents: Record<string, GardenNoteDocument>; onLoadNote: (note: GardenNote) => Promise<void>; onSaveNote: (note: GardenNote, document: GardenNoteDocument) => Promise<boolean> }) {
  if (route.kind === "notes") return <NotesIndex notes={visibleNotes} language={language} category={route.category} />;
  if (route.kind === "note") return <NotePage note={(editable ? notes : getPublicNotes()).find((item) => item.type === route.type && item.slug === route.slug)} editable={editable} language={language} documents={documents} onLoad={onLoadNote} onSave={onSaveNote} />;
  if (route.kind === "tags") return <TagsPage notes={visibleNotes} />;
  if (route.kind === "tag") return <NotesIndex notes={visibleNotes.filter((note) => note.tags.includes(route.tag))} language={language} title={`#${route.tag}`} />;
  if (route.kind === "photos") return <PhotosIndex photos={visiblePhotos} />;
  if (route.kind === "album") return <AlbumPage album={findAlbum(route.album)} photos={photosForAlbum(route.album, editable)} />;
  if (route.kind === "photo") return <PhotoPage photo={findPhoto(route.album, route.slug, editable)} photos={photosForAlbum(route.album, editable)} />;
  if (route.kind === "new-note") return <NewNote />;
  if (route.kind === "new-photo") return <NewPhoto />;
  return <Home content={content} notes={visibleNotes} photos={visiblePhotos} language={language} />;
}

function Home({ content, notes, photos, language }: { content: SiteContent[Language]; notes: GardenNote[]; photos: Photo[]; language: Language }) {
  return <div className="page home"><p className="eyebrow">KNOWLEDGE MAP / 00</p><h1>{content.title}</h1><p className="lede">{content.subtitle}</p><p className="intro">{content.intro}</p><div className="stat-grid"><span><b>{String(notes.length).padStart(2, "0")}</b> 公开笔记</span><span><b>{String(getAllTags().filter((tag) => notes.some((note) => note.tags.includes(tag.name))).length).padStart(2, "0")}</b> 主题</span><span><b>{String(photos.length).padStart(2, "0")}</b> 摄影作品</span></div><Section title="最近写下的线索" href={notesHref()}><div className="note-grid">{notes.slice(0, 4).map((note) => <NoteCard key={note.slug} note={note} language={language} />)}</div></Section><Section title="摄影精选" href="#/photos">{photos.length ? <div className="photo-grid compact">{photos.slice(0, 4).map((photo) => <PhotoCard key={photo.slug} photo={photo} />)}</div> : <Empty text="摄影作品将在这里出现。" />}</Section><footer>{content.contactLabel} · {content.contactValue}</footer></div>;
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) { return <section><div className="section-title"><h2>{title}</h2><a href={href}>查看全部 ↗</a></div>{children}</section>; }
function Empty({ text }: { text: string }) { return <p className="empty">{text}</p>; }
function NoteCard({ note, language }: { note: GardenNote; language: Language }) { return <article className="note-card"><div><span>{labels[language][note.type]}</span><time>{formatDate(note.updated)}</time></div><h3><a href={noteHref(note)}>{note.title}</a></h3><p>{note.summary}</p><small>{note.tags.map((tag) => `#${tag}`).join(" ")}</small></article>; }

function NotesIndex({ notes, language, category, title }: { notes: GardenNote[]; language: Language; category?: NoteKind; title?: string }) { const shown = category ? notes.filter((note) => note.type === category) : notes; return <div className="page"><p className="eyebrow">KNOWLEDGE / {category ? labels[language][category].toUpperCase() : "ALL"}</p><h1>{title ?? (category ? labels[language][category] : "知识库")}</h1><p className="lede">{shown.length} 篇可公开的线索与记录。</p><div className="note-grid">{shown.map((note) => <NoteCard key={note.slug} note={note} language={language} />)}</div>{!shown.length && <Empty text="这里还没有公开笔记。" />}</div>; }
function TagsPage({ notes }: { notes: GardenNote[] }) { const tags = new Map<string, number>(); notes.forEach((note) => note.tags.forEach((tag) => tags.set(tag, (tags.get(tag) ?? 0) + 1))); return <div className="page"><p className="eyebrow">KNOWLEDGE MAP</p><h1>主题</h1><div className="tag-cloud">{[...tags].sort().map(([tag, count]) => <a key={tag} href={tagHref(tag)}>#{tag}<small>{count}</small></a>)}</div></div>; }

function NotePage({ note, editable, language, documents, onLoad, onSave }: { note?: GardenNote; editable: boolean; language: Language; documents: Record<string, GardenNoteDocument>; onLoad: (note: GardenNote) => Promise<void>; onSave: (note: GardenNote, document: GardenNoteDocument) => Promise<boolean> }) {
  useEffect(() => { if (editable && note) void onLoad(note); }, [editable, note?.slug]);
  if (!note) return <div className="page"><Empty text="这篇笔记不存在，或尚未发布。" /></div>;
  const key = `${note.type}/${note.slug}`; const document = documents[key]; const shown = document ? { ...note, ...document.frontmatter, body: document.body } : note;
  return <article className="page note-page"><a className="back" href={`#/notes/${note.type}`}>← 返回{labels[language][note.type]}</a><p className="eyebrow">{labels[language][note.type]} / {formatDate(shown.updated)}</p>{editable && document ? <NoteEditor note={note} document={document} onSave={onSave} /> : <><h1>{shown.title}</h1><p className="lede">{shown.summary}</p><p className="tag-line">{shown.tags.map((tag) => <a key={tag} href={tagHref(tag)}>#{tag}</a>)}</p><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{shown.body}</ReactMarkdown></div><Related note={shown} /></>}</article>;
}
function Related({ note }: { note: GardenNote }) { const related = findRelatedNotes(note); return related.length ? <aside className="related"><b>相关笔记</b>{related.map((item) => <a key={item.slug} href={noteHref(item)}>{item.title}</a>)}</aside> : null; }
function NoteEditor({ note, document, onSave }: { note: GardenNote; document: GardenNoteDocument; onSave: (note: GardenNote, document: GardenNoteDocument) => Promise<boolean> }) { const [draft, setDraft] = useState(document); const [message, setMessage] = useState(""); useEffect(() => setDraft(document), [document]); const update = (field: keyof GardenNoteDocument["frontmatter"], value: string | string[]) => setDraft((current) => ({ ...current, frontmatter: { ...current.frontmatter, [field]: value } })); return <><div className="edit-status">本地编辑模式 · {message}</div><div className="edit-grid"><label>标题<input value={draft.frontmatter.title} onChange={(event) => update("title", event.target.value)} /></label><label>摘要<textarea value={draft.frontmatter.summary} onChange={(event) => update("summary", event.target.value)} /></label><label>状态<select value={draft.frontmatter.status} onChange={(event) => update("status", event.target.value)}>{["draft", "editing", "published", "archived"].map((status) => <option key={status}>{status}</option>)}</select></label><label>标签（逗号）<input value={draft.frontmatter.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label></div><label className="body-editor">正文 Markdown<textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} /></label><button className="primary" onClick={() => void onSave(note, draft).then((ok) => setMessage(ok ? "已保存" : "保存失败"))}>保存到本地文件</button><div className="markdown preview"><small>实时预览</small><ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body}</ReactMarkdown></div></>; }

function PhotosIndex({ photos }: { photos: Photo[] }) { return <div className="page"><p className="eyebrow">PHOTOGRAPHS</p><h1>摄影</h1><p className="lede">从专题、地点与时间回看留下的画面。</p>{albums.length > 0 && <div className="album-list">{albums.map((album) => <a key={album.slug} href={`#/photos/${album.slug}`}><span>{album.title}</span><small>{album.location} · {photos.filter((photo) => photo.album === album.slug).length} 张</small></a>)}</div>}<div className="photo-grid">{photos.map((photo) => <PhotoCard key={`${photo.album}-${photo.slug}`} photo={photo} />)}</div>{!photos.length && <Empty text="暂无已发布的摄影作品。可在本地编辑模式上传第一张照片。" />}</div>; }
function PhotoCard({ photo }: { photo: Photo }) { return <a className="photo-card" href={photoHref(photo)}><img src={photo.thumbnail} srcSet={`${photo.thumbnail} 720w, ${photo.image} 1600w`} sizes="(max-width: 720px) 100vw, 42vw" width={photo.width} height={photo.height} loading="lazy" alt={photo.alt} /><span><b>{photo.title}</b><small>{photo.location} · {formatDate(photo.date)}</small></span></a>; }
function AlbumPage({ album, photos }: { album?: ReturnType<typeof findAlbum>; photos: Photo[] }) { if (!album) return <div className="page"><Empty text="这个摄影专题不存在。" /></div>; return <div className="page"><a className="back" href="#/photos">← 摄影</a><p className="eyebrow">PHOTO ESSAY</p><h1>{album.title}</h1><p className="lede">{album.description}</p><p className="muted">{album.location} · {formatDate(album.date)}</p><div className="photo-grid">{photos.map((photo) => <PhotoCard key={photo.slug} photo={photo} />)}</div>{!photos.length && <Empty text="这个专题还没有已发布作品。" />}</div>; }
function PhotoPage({ photo, photos }: { photo?: Photo; photos: Photo[] }) { if (!photo) return <div className="page"><Empty text="这张照片不存在，或尚未发布。" /></div>; const index = photos.findIndex((item) => item.slug === photo.slug); return <article className="page photo-detail"><a className="back" href={`#/photos/${photo.album}`}>← 返回专题</a><img src={photo.image} width={photo.width} height={photo.height} alt={photo.alt} /><p className="eyebrow">{formatDate(photo.date)} · {photo.location}</p><h1>{photo.title}</h1><p className="lede">{photo.description}</p><p className="tag-line">{photo.tags.map((tag) => `#${tag}`).join(" ")}</p><div className="photo-neighbors">{photos[index - 1] && <a href={photoHref(photos[index - 1])}>← 上一张</a>}{photos[index + 1] && <a href={photoHref(photos[index + 1])}>下一张 →</a>}</div></article>; }

function NewNote() { const [type, setType] = useState<NoteKind>("thinking"); const [slug, setSlug] = useState(""); const [title, setTitle] = useState(""); const [message, setMessage] = useState(""); async function submit(event: React.FormEvent) { event.preventDefault(); const response = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, slug, title }) }); if (!response.ok) return setMessage(await response.text()); location.hash = `#/notes/${type}/${slug}`; } return <form className="page form-page" onSubmit={submit}><p className="eyebrow">LOCAL EDIT</p><h1>新建笔记</h1><label>分类<select value={type} onChange={(event) => setType(event.target.value as NoteKind)}>{kinds.map((kind) => <option key={kind} value={kind}>{labels.zh[kind]}</option>)}</select></label><label>Slug（小写 kebab-case）<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(event.target.value)} /></label><label>标题<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label><button className="primary">创建草稿</button><p className="error">{message}</p></form>; }
function NewPhoto() { const [message, setMessage] = useState(""); async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch("/api/photos", { method: "POST", body: new FormData(event.currentTarget) }); if (!response.ok) return setMessage(await response.text()); const result = await response.json() as { album: string; slug: string }; location.hash = `#/photos/${result.album}/${result.slug}`; } return <form className="page form-page" onSubmit={submit}><p className="eyebrow">LOCAL EDIT</p><h1>上传照片</h1><label>专题 slug<input required name="album" placeholder="例如 shanghai-spring" /></label><label>专题标题<input required name="albumTitle" /></label><label>专题简介<textarea required name="albumDescription" /></label><label>照片 slug<input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label>照片标题<input required name="title" /></label><label>拍摄日期<input required name="date" type="date" /></label><label>地点<input required name="location" /></label><label>标签（逗号）<input name="tags" /></label><label>说明<textarea name="description" /></label><label>图片替代文本<input required name="alt" /></label><label>图片文件<input required name="image" accept="image/jpeg,image/png,image/webp" type="file" /></label><button className="primary">上传为草稿</button><p className="error">{message}</p></form>; }
