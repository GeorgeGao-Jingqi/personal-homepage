import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ContactSection,
  ExperienceSection,
  HeroSection,
  ProjectsSection,
  SkillsSection,
  StorySection,
} from "./ProfileSections";
import { EditableText } from "./EditableText";
import { findNote, findRelatedNotes, getAllTags, getNotesByKind, getPublicNotes, notes } from "../notes";
import type {
  Content,
  EditableListKey,
  GardenNote,
  Language,
  NoteKind,
  ProfileContent,
  ProfileTextField,
  Project,
} from "../types";

type ProfileSurfaceProps = {
  profile: ProfileContent;
  language: Language;
  editable: boolean;
  onFieldChange: (field: ProfileTextField, value: string) => void;
  onListChange: (key: EditableListKey, index: number, field: string, value: string) => void;
  onOpenChat: () => void;
};

type Route =
  | { kind: "home" }
  | { kind: "profile" }
  | { kind: "projects" }
  | { kind: "about" }
  | { kind: "contact" }
  | { kind: "notes"; category?: NoteKind }
  | { kind: "note"; slug: string }
  | { kind: "tags" }
  | { kind: "tag"; tag: string };

const noteKindLabels: Record<Language, Record<NoteKind, string>> = {
  zh: { thinking: "Thinking Notes", learning: "Learning Log", reading: "Reading Notes" },
  en: { thinking: "Thinking Notes", learning: "Learning Log", reading: "Reading Notes" },
};

const noteKindDescriptions: Record<Language, Record<NoteKind, string>> = {
  zh: {
    thinking: "把问题拆开，记录我如何形成判断。",
    learning: "记录正在学习的工具、方法和小实验。",
    reading: "留下书籍、文章和研究材料的可复用摘记。",
  },
  en: {
    thinking: "Questions, frameworks, and the reasoning behind my judgments.",
    learning: "Small experiments with tools, methods, and ideas in progress.",
    reading: "Reusable notes from books, essays, and research materials.",
  },
};

const uiCopy = {
  zh: {
    garden: "个人数字花园",
    subtitle: "一份持续生长的分析工作台",
    home: "首页",
    profile: "个人档案",
    projects: "项目成果",
    about: "关于我",
    contact: "联系",
    notes: "知识库",
    tags: "主题",
    search: "搜索笔记、标签或关键词",
    searchResults: "搜索结果",
    latest: "最近更新",
    featured: "精选项目",
    currentFocus: "当前关注",
    knowledgeMap: "知识地图",
    updated: "更新于",
    read: "阅读笔记",
    back: "返回笔记列表",
    related: "相关笔记",
    source: "参考来源",
    statusEditing: "编辑中",
    statusPublished: "已发布",
    readTime: "分钟阅读",
    noResults: "暂时没有匹配内容。",
    notFound: "这页还没有长出来。",
    notFoundLead: "链接可能已经改变，也可能这篇笔记仍然藏在草稿里。",
    viewAll: "查看全部",
    browseTopics: "浏览主题",
    explore: "进入花园",
    openProfile: "查看个人档案",
    viewProjects: "查看项目成果",
    question: "我正在追问",
    signal: "更新信号",
    notesCount: "篇公开笔记",
    tagsCount: "个主题标签",
    categories: "个内容分区",
    menu: "打开导航",
    closeMenu: "关闭导航",
  },
  en: {
    garden: "Personal Digital Garden",
    subtitle: "A growing workspace for analytical thinking",
    home: "Home",
    profile: "Profile",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    notes: "Knowledge garden",
    tags: "Topics",
    search: "Search notes, tags, or keywords",
    searchResults: "Search results",
    latest: "Latest updates",
    featured: "Featured projects",
    currentFocus: "Current focus",
    knowledgeMap: "Knowledge map",
    updated: "Updated",
    read: "Read note",
    back: "Back to notes",
    related: "Related notes",
    source: "Source",
    statusEditing: "Editing",
    statusPublished: "Published",
    readTime: "min read",
    noResults: "No matching notes yet.",
    notFound: "This page has not grown yet.",
    notFoundLead: "The link may have changed, or this note may still be a draft.",
    viewAll: "View all",
    browseTopics: "Browse topics",
    explore: "Enter the garden",
    openProfile: "View profile",
    viewProjects: "View projects",
    question: "Question in progress",
    signal: "Update signal",
    notesCount: "public notes",
    tagsCount: "topic tags",
    categories: "content areas",
    menu: "Open navigation",
    closeMenu: "Close navigation",
  },
} as const;

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  const segments = path.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
  if (segments.length === 0) return { kind: "home" };
  if (segments[0] === "profile") return { kind: "profile" };
  if (segments[0] === "projects") return { kind: "projects" };
  if (segments[0] === "about") return { kind: "about" };
  if (segments[0] === "contact") return { kind: "contact" };
  if (segments[0] === "tags" && segments[1]) return { kind: "tag", tag: segments[1] };
  if (segments[0] === "tags") return { kind: "tags" };
  if (segments[0] === "notes" && segments[1] && segments[2]) return { kind: "note", slug: segments[2] };
  if (segments[0] === "notes" && segments[1]) {
    const category = segments[1] as NoteKind;
    return category === "thinking" || category === "learning" || category === "reading"
      ? { kind: "notes", category }
      : { kind: "notes" };
  }
  if (segments[0] === "notes") return { kind: "notes" };
  return { kind: "home" };
}

function noteHref(note: GardenNote): string {
  return `#/notes/${note.type}/${encodeURIComponent(note.slug)}`;
}

function formatDate(value: string, language: Language): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function estimateReadTime(body: string): number {
  const chineseCharacters = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = body.replace(/[\u4e00-\u9fff]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(chineseCharacters / 420 + words / 190));
}

export function DigitalGarden({
  content,
  profile,
  language,
  editable,
  onFieldChange,
  onListChange,
  onOpenChat,
  onToggleLanguage,
  isEditMode,
  editStatus,
  onResetContent,
}: ProfileSurfaceProps & {
  content: Content;
  onToggleLanguage: () => void;
  isEditMode: boolean;
  editStatus: string;
  onResetContent: () => void;
}) {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [search, setSearch] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const copy = uiCopy[language];
  const publicNotes = getPublicNotes();

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      setNavOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return publicNotes.filter((note) => [note.title, note.summary, note.tags.join(" "), note.body].join(" ").toLowerCase().includes(query)).slice(0, 6);
  }, [publicNotes, search]);

  function closeNavigation() {
    setNavOpen(false);
  }

  return (
    <div className="garden-shell">
      <aside className={`garden-sidebar ${navOpen ? "is-open" : ""}`}>
        <div className="sidebar-head">
          <a className="sidebar-brand" href="#/" onClick={closeNavigation}>
            <span className="sidebar-mark" aria-hidden="true">GG</span>
            <span>
              <strong>{profile.name}</strong>
              <small>{copy.garden}</small>
            </span>
          </a>
          <button className="sidebar-menu-toggle" type="button" onClick={() => setNavOpen((current) => !current)} aria-label={navOpen ? copy.closeMenu : copy.menu} aria-expanded={navOpen}>
            <span aria-hidden="true">{navOpen ? "×" : "☰"}</span>
          </button>
        </div>

        <div className="sidebar-nav">
          <GardenNavLink href="#/" active={route.kind === "home"} onClick={closeNavigation}>{copy.home}</GardenNavLink>
          <GardenNavLink href="#/profile" active={route.kind === "profile"} onClick={closeNavigation}>{copy.profile}</GardenNavLink>
          <GardenNavLink href="#/projects" active={route.kind === "projects"} onClick={closeNavigation}>{copy.projects}</GardenNavLink>
          <span className="nav-label">{language === "zh" ? "知识库" : "Knowledge"}</span>
          {(Object.keys(noteKindLabels[language]) as NoteKind[]).map((kind) => (
            <GardenNavLink key={kind} href={`#/notes/${kind}`} active={route.kind === "notes" && route.category === kind} onClick={closeNavigation} category count={getNotesByKind(kind).length}>
              {noteKindLabels[language][kind]}
            </GardenNavLink>
          ))}
          <span className="nav-label">{language === "zh" ? "关于这个人" : "About the person"}</span>
          <GardenNavLink href="#/about" active={route.kind === "about"} onClick={closeNavigation}>{copy.about}</GardenNavLink>
          <GardenNavLink href="#/contact" active={route.kind === "contact"} onClick={closeNavigation}>{copy.contact}</GardenNavLink>
        </div>

        <div className="sidebar-tools">
          <label className="garden-search">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search} aria-label={copy.search} />
            <kbd>⌘ K</kbd>
          </label>
          {search.trim() && (
            <div className="search-results">
              <div className="search-results-head"><span>{copy.searchResults}</span><strong>{searchResults.length}</strong></div>
              {searchResults.length > 0 ? searchResults.map((note) => (
                <a key={note.slug} href={noteHref(note)} onClick={() => { setSearch(""); closeNavigation(); }}>
                  <span>{note.title}</span>
                  <small>{noteKindLabels[language][note.type]}</small>
                </a>
              )) : <p>{copy.noResults}</p>}
            </div>
          )}
        </div>

        <div className="sidebar-foot">
          <button className="language-button" type="button" onClick={onToggleLanguage}>{language === "zh" ? "EN" : "中"}</button>
          <span>{copy.subtitle}</span>
        </div>
      </aside>

      <div className="garden-main">
        <div className="mobile-contextbar">
          <span>{route.kind === "note" ? copy.read : route.kind === "notes" ? (route.category ? noteKindLabels[language][route.category] : copy.notes) : copy.garden}</span>
          <button type="button" onClick={onToggleLanguage}>{language === "zh" ? "EN" : "中"}</button>
        </div>
        {isEditMode && (
          <aside className="edit-banner garden-edit-banner">
            <span>{editStatus}</span>
            <button type="button" onClick={onResetContent}>{language === "zh" ? "恢复默认" : "Reset"}</button>
          </aside>
        )}
        <main className="garden-content">
          <GardenPage
            route={route}
            profile={profile}
            content={content}
            language={language}
            editable={editable}
            onFieldChange={onFieldChange}
            onListChange={onListChange}
            onOpenChat={onOpenChat}
            copy={copy}
            publicNotes={publicNotes}
          />
        </main>
        <footer className="garden-footer">
          <span>GG / {new Date().getFullYear()}</span>
          <span>{copy.subtitle}</span>
          <a href="#/contact">{copy.contact} ↗</a>
        </footer>
      </div>
    </div>
  );
}

function GardenNavLink({ href, active, category = false, count, onClick, children }: { href: string; active: boolean; category?: boolean; count?: number; onClick: () => void; children: React.ReactNode }) {
  return <a className={`garden-nav-link ${active ? "is-active" : ""} ${category ? "is-category" : ""}`} href={href} onClick={onClick}><span>{children}</span>{typeof count === "number" && <small>{String(count).padStart(2, "0")}</small>}</a>;
}

function GardenPage({ route, profile, content, language, editable, onFieldChange, onListChange, onOpenChat, copy, publicNotes }: {
  route: Route;
  profile: ProfileContent;
  content: Content;
  language: Language;
  editable: boolean;
  onFieldChange: ProfileSurfaceProps["onFieldChange"];
  onListChange: ProfileSurfaceProps["onListChange"];
  onOpenChat: () => void;
  copy: (typeof uiCopy)[Language];
  publicNotes: GardenNote[];
}) {
  if (route.kind === "note") return <NoteDetail note={findNote(route.slug)} language={language} copy={copy} publicNotes={publicNotes} />;
  if (route.kind === "notes") return <NotesIndex category={route.category} language={language} copy={copy} publicNotes={publicNotes} />;
  if (route.kind === "tags") return <TagsIndex language={language} copy={copy} />;
  if (route.kind === "tag") return <TagDetail tag={route.tag} language={language} copy={copy} publicNotes={publicNotes} />;
  if (route.kind === "home") return <GardenHome profile={profile} language={language} copy={copy} publicNotes={publicNotes} editable={editable} onFieldChange={onFieldChange} onOpenChat={onOpenChat} />;

  return <ProfileSurface section={route.kind} profile={profile} language={language} editable={editable} onFieldChange={onFieldChange} onListChange={onListChange} onOpenChat={onOpenChat} content={content} />;
}

function GardenHome({ profile, language, copy, publicNotes, editable, onFieldChange, onOpenChat }: {
  profile: ProfileContent;
  language: Language;
  copy: (typeof uiCopy)[Language];
  publicNotes: GardenNote[];
  editable: boolean;
  onFieldChange: ProfileSurfaceProps["onFieldChange"];
  onOpenChat: () => void;
}) {
  const latestNotes = publicNotes.slice(0, 4);
  return (
    <div className="home-page">
      <section className="garden-home-hero">
        <div className="home-hero-copy">
          <div className="garden-overline"><span className="status-dot" /> {copy.garden} <span className="mono">/ 00</span></div>
          <EditableText value={profile.name} onChange={(value) => onFieldChange("name", value)} editable={editable} as="h1" />
          <EditableText value={profile.tagline} onChange={(value) => onFieldChange("tagline", value)} editable={editable} as="p" className="home-tagline" multiline />
          <EditableText value={profile.intro} onChange={(value) => onFieldChange("intro", value)} editable={editable} as="p" className="home-intro" multiline />
          <div className="home-actions">
            <a className="garden-button garden-button-dark" href="#/notes">{copy.explore} <span aria-hidden="true">↗</span></a>
            <a className="garden-button garden-button-light" href="#/profile">{copy.openProfile}</a>
            <button className="text-button" type="button" onClick={onOpenChat}>{profile.aiTitle} <span aria-hidden="true">+</span></button>
          </div>
        </div>
        <div className="home-hero-aside">
          <div className="signal-card">
            <div className="signal-card-head"><span>{copy.signal}</span><span className="mono">LIVE</span></div>
            <div className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            <p>{language === "zh" ? "正在把问题、学习和阅读整理成可回看的线索。" : "Turning questions, learning, and reading into traceable threads."}</p>
          </div>
          <div className="home-hero-index"><span>GG</span><small>ANALYTICS<br />GARDEN</small></div>
        </div>
      </section>

      <section className="home-stats" aria-label={copy.knowledgeMap}>
        <Stat value={String(publicNotes.length).padStart(2, "0")} label={copy.notesCount} />
        <Stat value={String(getAllTags().length).padStart(2, "0")} label={copy.tagsCount} />
        <Stat value="03" label={copy.categories} />
      </section>

      <section className="garden-home-section">
        <GardenSectionTitle eyebrow={copy.latest} title={language === "zh" ? "最近写下的线索" : "Recent threads"} href="#/notes" linkLabel={copy.viewAll} />
        <div className="latest-grid">
          {latestNotes.map((note) => <NoteCard key={note.slug} note={note} language={language} copy={copy} />)}
        </div>
      </section>

      <section className="garden-home-section home-lower-grid">
        <div>
          <GardenSectionTitle eyebrow={copy.currentFocus} title={language === "zh" ? "把分析变成行动" : "Make analysis useful"} />
          <div className="focus-note"><span className="focus-index">01</span><div><h3>{profile.experience[0]?.title}</h3><p>{profile.experience[0]?.detail}</p><a href="#/about">{copy.about} ↗</a></div></div>
        </div>
        <div>
          <GardenSectionTitle eyebrow={copy.featured} title={profile.projectsTitle} href="#/projects" linkLabel={copy.viewAll} />
          <div className="featured-project-list">{profile.projects.slice(0, 2).map((project, index) => <ProjectPreview key={`${project.title}-${index}`} project={project} index={index} />)}</div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="home-stat"><strong>{value}</strong><span>{label}</span></div>;
}

function GardenSectionTitle({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="garden-section-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{href && <a href={href}>{linkLabel} ↗</a>}</div>;
}

function NoteCard({ note, language, copy, compact = false }: { note: GardenNote; language: Language; copy: (typeof uiCopy)[Language]; compact?: boolean }) {
  return <article className={`garden-note-card ${compact ? "is-compact" : ""}`}><div className="note-card-meta"><span className={`note-type type-${note.type}`}>{noteKindLabels[language][note.type]}</span><span>{formatDate(note.updated, language)}</span></div><h3><a href={noteHref(note)}>{note.title}</a></h3><p>{note.summary}</p><div className="note-card-foot"><span>{estimateReadTime(note.body)} {copy.readTime}</span><span className={`note-status ${note.status}`}>{note.status === "editing" ? copy.statusEditing : copy.statusPublished}</span></div></article>;
}

function ProjectPreview({ project, index }: { project: Project; index: number }) {
  return <a className="project-preview" href="#/projects"><span className="project-preview-index">0{index + 1}</span><span><strong>{project.title}</strong><small>{project.tools}</small></span><span aria-hidden="true">↗</span></a>;
}

function NotesIndex({ category, language, copy, publicNotes }: { category?: NoteKind; language: Language; copy: (typeof uiCopy)[Language]; publicNotes: GardenNote[] }) {
  const notesToShow = category ? publicNotes.filter((note) => note.type === category) : publicNotes;
  const title = category ? noteKindLabels[language][category] : copy.notes;
  const description = category ? noteKindDescriptions[language][category] : language === "zh" ? "这里记录问题、练习、阅读和仍在变化的判断。" : "Questions, experiments, readings, and judgments that are still changing.";
  const noteKinds = Object.keys(noteKindLabels[language]) as NoteKind[];
  return <div className="notes-page"><PageIntro eyebrow={category ? `0${noteKinds.indexOf(category) + 1}` : "GARDEN"} title={title} intro={description} />{!category && <div className="knowledge-directory" aria-label={language === "zh" ? "知识库分类" : "Knowledge categories"}>{noteKinds.map((kind, index) => <a key={kind} className={`knowledge-category-link category-${kind}`} href={`#/notes/${kind}`}><span className="knowledge-category-index">0{index + 1}</span><span><strong>{noteKindLabels[language][kind]}</strong><small>{noteKindDescriptions[language][kind]}</small></span><span className="knowledge-category-arrow" aria-hidden="true">↗</span></a>)}<a className="knowledge-topics-link" href="#/tags"><span>{copy.browseTopics}</span><span aria-hidden="true">↗</span></a></div>}<div className="notes-filter-row"><span>{String(notesToShow.length).padStart(2, "0")} {language === "zh" ? "篇笔记" : "notes"}</span><div>{category && <a className="filter-chip" href="#/notes">{copy.notes}</a>}</div></div><div className="notes-list">{notesToShow.map((note) => <NoteCard key={note.slug} note={note} language={language} copy={copy} />)}</div></div>;
}

function NoteDetail({ note, language, copy, publicNotes }: { note?: GardenNote; language: Language; copy: (typeof uiCopy)[Language]; publicNotes: GardenNote[] }) {
  if (!note) return <NotFound copy={copy} />;
  const relatedNotes = findRelatedNotes(note);
  return <article className="note-detail"><a className="back-link" href={`#/notes/${note.type}`}>← {copy.back}</a><header className="note-detail-header"><div className="note-detail-type"><span className={`note-type type-${note.type}`}>{noteKindLabels[language][note.type]}</span><span>{note.status === "editing" ? copy.statusEditing : copy.statusPublished}</span></div><h1>{note.title}</h1><p className="note-detail-summary">{note.summary}</p><div className="note-detail-meta"><span>{copy.updated} {formatDate(note.updated, language)}</span><span>{estimateReadTime(note.body)} {copy.readTime}</span>{note.tags.map((tag) => <a key={tag} href={`#/tags/${encodeURIComponent(tag)}`}>#{tag}</a>)}</div></header><div className="note-detail-layout"><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{note.body}</ReactMarkdown></div><aside className="note-detail-aside"><div><span className="aside-label">{copy.knowledgeMap}</span><a href={`#/notes/${note.type}`}>{noteKindLabels[language][note.type]}</a></div>{note.source && <div><span className="aside-label">{copy.source}</span>{note.sourceUrl ? <a href={note.sourceUrl} target="_blank" rel="noreferrer">{note.source} ↗</a> : <span>{note.source}</span>}</div>}{relatedNotes.length > 0 && <div><span className="aside-label">{copy.related}</span>{relatedNotes.map((related) => <a key={related.slug} href={noteHref(related)}>{related.title}</a>)}</div>}</aside></div>{publicNotes.length > 0 && <div className="note-detail-next"><span>{language === "zh" ? "继续探索" : "Keep exploring"}</span><a href="#/notes">{copy.viewAll} ↗</a></div>}</article>;
}

function TagsIndex({ language, copy }: { language: Language; copy: (typeof uiCopy)[Language] }) {
  const tags = getAllTags();
  return <div className="tags-page"><PageIntro eyebrow="MAP" title={copy.tags} intro={language === "zh" ? "从主题切入，找到不同笔记之间的连接。" : "Enter through a topic and find the connections between notes."} /><div className="tag-cloud">{tags.map((tag) => <a key={tag.name} className="tag-link" href={`#/tags/${encodeURIComponent(tag.name)}`}><span>#{tag.name}</span><small>{String(tag.count).padStart(2, "0")}</small></a>)}</div></div>;
}

function TagDetail({ tag, language, copy, publicNotes }: { tag: string; language: Language; copy: (typeof uiCopy)[Language]; publicNotes: GardenNote[] }) {
  const matchingNotes = publicNotes.filter((note) => note.tags.includes(tag));
  return <div className="notes-page"><a className="back-link" href="#/tags">← {copy.tags}</a><PageIntro eyebrow="TAG" title={`#${tag}`} intro={language === "zh" ? `围绕“${tag}”的笔记。` : `Notes connected to “${tag}”.`} /><div className="notes-list">{matchingNotes.length > 0 ? matchingNotes.map((note) => <NoteCard key={note.slug} note={note} language={language} copy={copy} />) : <p className="empty-state">{copy.noResults}</p>}</div></div>;
}

function PageIntro({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return <header className="page-intro"><span>{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header>;
}

function NotFound({ copy }: { copy: (typeof uiCopy)[Language] }) {
  return <div className="not-found"><span>404 / NOTE</span><h1>{copy.notFound}</h1><p>{copy.notFoundLead}</p><a className="garden-button garden-button-dark" href="#/notes">{copy.back} ↗</a></div>;
}

function ProfileSurface({ section, content, ...props }: ProfileSurfaceProps & { section: "profile" | "projects" | "about" | "contact"; content: Content }) {
  if (section === "projects") return <div className="profile-view"><ProjectsSection {...props} /></div>;
  if (section === "contact") return <div className="profile-view"><ContactSection {...props} /></div>;
  if (section === "about") return <div className="profile-view"><StorySection {...props} /><ExperienceSection {...props} /></div>;
  return <div className="profile-view"><HeroSection {...props} /><StorySection {...props} /><ProjectsSection {...props} /><SkillsSection {...props} /><ExperienceSection {...props} /><ContactSection {...props} /></div>;
}
