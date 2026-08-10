import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import heroWorkspace from "../assets/hero-workspace.png";
import defaultContentData from "./content.json";
import "./styles.css";
import type { Contact, Content, Experience, Language, ProfileContent, Project, SkillGroup } from "./types";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type SaveState = "idle" | "saving" | "saved" | "browser-fallback" | "error";

const STORAGE_KEY = "resume-homepage-content-draft-v1";
const defaultContent = defaultContentData as Content;

function getInitialContent(isEditMode: boolean): Content {
  if (!isEditMode) return defaultContent;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Content) : defaultContent;
  } catch {
    return defaultContent;
  }
}

function hasProfileShape(content: unknown): content is Content {
  const candidate = content as Partial<Content>;
  return Boolean(candidate?.zh?.projects && candidate?.en?.projects && candidate.zh.contacts && candidate.en.contacts);
}

async function fetchFileContent(): Promise<Content | null> {
  const response = await fetch("/api/content");
  if (!response.ok) return null;
  const next = (await response.json()) as unknown;
  return hasProfileShape(next) ? next : null;
}

async function persistFileContent(content: Content): Promise<boolean> {
  const response = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  return response.ok;
}

function getAiReply(input: string, profile: ProfileContent, language: Language): string {
  const text = input.toLowerCase();
  const isChinese = language === "zh";

  if (text.includes("项目") || text.includes("project")) {
    const project = profile.projects[0];
    return isChinese
      ? `可以先看「${project.title}」。它体现了我如何从业务问题出发：${project.problem} 我的做法是${project.approach}，最后产出是${project.impact}`
      : `A good example is "${project.title}". It shows how I start from a business problem: ${project.problem} My approach was: ${project.approach} The outcome was: ${project.impact}`;
  }

  if (text.includes("技能") || text.includes("工具") || text.includes("skill") || text.includes("tool")) {
    return isChinese
      ? `我的技能主要集中在 ${profile.skills.map((skill) => skill.title).join("、")}。如果你是招聘方，我建议重点看项目卡里的“问题-方法-影响”，那里更能说明这些工具如何被使用。`
      : `My skills are mainly around ${profile.skills.map((skill) => skill.title).join(", ")}. If you are reviewing me as a candidate, the project cards show how those tools are used in context.`;
  }

  if (text.includes("成长") || text.includes("背景") || text.includes("story") || text.includes("background")) {
    return profile.story;
  }

  if (text.includes("联系") || text.includes("contact") || text.includes("email")) {
    const email = profile.contacts.find((item) => item.label.toLowerCase() === "email");
    return isChinese
      ? `你可以通过 ${email?.value ?? "页面底部的联系方式"} 联系我。`
      : `You can reach me at ${email?.value ?? "the contact links at the bottom of the page"}.`;
  }

  return isChinese
    ? `我可以介绍 ${profile.name} 的成长背景、数据分析项目、技能工具和求职方向。你可以试着问：“你最能体现分析能力的项目是什么？”`
    : `I can talk about ${profile.name}'s growth story, analytics projects, skills, and career direction. Try asking: "Which project best shows your analytical ability?"`;
}

function App() {
  const isEditMode = useMemo(() => new URLSearchParams(window.location.search).get("edit") === "1", []);
  const [content, setContent] = useState<Content>(() => getInitialContent(isEditMode));
  const [language, setLanguage] = useState<Language>("zh");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "你好，我可以帮你了解这个候选人的成长背景、项目成果和技能工具。",
    },
  ]);

  const profile = content[language];

  useEffect(() => {
    if (!isEditMode) return;

    fetchFileContent()
      .then((fileContent) => {
        if (fileContent) {
          setContent(fileContent);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fileContent));
          setSaveState("saved");
        }
      })
      .catch(() => {
        setSaveState("browser-fallback");
      });
  }, [isEditMode]);

  async function saveContent(next: Content) {
    setContent(next);

    if (!isEditMode) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaveState("saving");

    try {
      const didSaveToFile = await persistFileContent(next);
      setSaveState(didSaveToFile ? "saved" : "browser-fallback");
    } catch {
      setSaveState("browser-fallback");
    }
  }

  function updateField(field: keyof ProfileContent, value: string) {
    void saveContent({
      ...content,
      [language]: {
        ...profile,
        [field]: value,
      },
    });
  }

  function updateList<T extends Project | SkillGroup | Experience | Contact>(
    key: "projects" | "skills" | "experience" | "contacts",
    index: number,
    field: keyof T,
    value: string,
  ) {
    const nextItems = [...(profile[key] as T[])];
    nextItems[index] = { ...nextItems[index], [field]: value };
    void saveContent({
      ...content,
      [language]: {
        ...profile,
        [key]: nextItems,
      },
    });
  }

  function resetContent() {
    localStorage.removeItem(STORAGE_KEY);
    void saveContent(defaultContent);
  }

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const reply = getAiReply(trimmed, profile, language);
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setInput("");
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#home">
          {profile.name}
        </a>
        <nav aria-label={language === "zh" ? "页面导航" : "Page navigation"}>
          <a href="#story">{language === "zh" ? "成长" : "Story"}</a>
          <a href="#projects">{language === "zh" ? "项目" : "Projects"}</a>
          <a href="#skills">{language === "zh" ? "技能" : "Skills"}</a>
          <a href="#contact">{language === "zh" ? "联系" : "Contact"}</a>
        </nav>
        <button className="language-toggle" type="button" onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>
          {language === "zh" ? "EN" : "中文"}
        </button>
      </header>

      {isEditMode && (
        <aside className="edit-banner">
          <span>{getEditStatusText(language, saveState)}</span>
          <button type="button" onClick={resetContent}>
            {language === "zh" ? "恢复默认" : "Reset"}
          </button>
        </aside>
      )}

      <section className="hero" id="home">
        <div className="hero-copy">
          <EditableText value={profile.role} onChange={(value) => updateField("role", value)} editable={isEditMode} className="eyebrow" />
          <EditableText value={profile.name} onChange={(value) => updateField("name", value)} editable={isEditMode} as="h1" />
          <EditableText value={profile.tagline} onChange={(value) => updateField("tagline", value)} editable={isEditMode} as="p" className="tagline" multiline />
          <EditableText value={profile.intro} onChange={(value) => updateField("intro", value)} editable={isEditMode} as="p" className="intro" multiline />
          <div className="hero-actions">
            <a className="primary-link" href="#projects">
              {language === "zh" ? "查看项目成果" : "View Projects"}
            </a>
            <button className="secondary-link" type="button" onClick={() => setIsChatOpen(true)}>
              {language === "zh" ? "打开 AI 对话" : "Open AI Chat"}
            </button>
          </div>
        </div>
        <img className="hero-image" src={heroWorkspace} alt="" />
      </section>

      <section className="section story" id="story">
        <SectionHeader
          title={profile.storyTitle}
          editable={isEditMode}
          onChange={(value) => updateField("storyTitle", value)}
        />
        <EditableText value={profile.story} onChange={(value) => updateField("story", value)} editable={isEditMode} as="p" multiline className="story-text" />
      </section>

      <section className="section" id="projects">
        <SectionHeader
          title={profile.projectsTitle}
          editable={isEditMode}
          onChange={(value) => updateField("projectsTitle", value)}
        />
        <div className="project-grid">
          {profile.projects.map((project, index) => (
            <article className="project-card" key={`${project.title}-${index}`}>
              <EditableText value={project.title} onChange={(value) => updateList<Project>("projects", index, "title", value)} editable={isEditMode} as="h3" />
              <Field label={language === "zh" ? "问题" : "Problem"} value={project.problem} editable={isEditMode} onChange={(value) => updateList<Project>("projects", index, "problem", value)} />
              <Field label={language === "zh" ? "方法" : "Approach"} value={project.approach} editable={isEditMode} onChange={(value) => updateList<Project>("projects", index, "approach", value)} />
              <Field label={language === "zh" ? "影响" : "Impact"} value={project.impact} editable={isEditMode} onChange={(value) => updateList<Project>("projects", index, "impact", value)} />
              <EditableText value={project.tools} onChange={(value) => updateList<Project>("projects", index, "tools", value)} editable={isEditMode} className="tool-pill" />
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="skills">
        <SectionHeader
          title={profile.skillsTitle}
          editable={isEditMode}
          onChange={(value) => updateField("skillsTitle", value)}
        />
        <div className="skills-grid">
          {profile.skills.map((skill, index) => (
            <article className="skill-card" key={`${skill.title}-${index}`}>
              <EditableText value={skill.title} onChange={(value) => updateList<SkillGroup>("skills", index, "title", value)} editable={isEditMode} as="h3" />
              <EditableText value={skill.items} onChange={(value) => updateList<SkillGroup>("skills", index, "items", value)} editable={isEditMode} as="p" multiline />
            </article>
          ))}
        </div>
      </section>

      <section className="section experience-section">
        <SectionHeader
          title={profile.experienceTitle}
          editable={isEditMode}
          onChange={(value) => updateField("experienceTitle", value)}
        />
        <div className="timeline">
          {profile.experience.map((item, index) => (
            <article className="timeline-item" key={`${item.title}-${index}`}>
              <EditableText value={item.title} onChange={(value) => updateList<Experience>("experience", index, "title", value)} editable={isEditMode} as="h3" />
              <EditableText value={item.detail} onChange={(value) => updateList<Experience>("experience", index, "detail", value)} editable={isEditMode} as="p" multiline />
            </article>
          ))}
        </div>
      </section>

      <section className="section contact" id="contact">
        <SectionHeader
          title={profile.contactTitle}
          editable={isEditMode}
          onChange={(value) => updateField("contactTitle", value)}
        />
        <div className="contact-links">
          {profile.contacts.map((contact, index) => (
            <div className="contact-item" key={`${contact.label}-${index}`}>
              <EditableText value={contact.label} onChange={(value) => updateList<Contact>("contacts", index, "label", value)} editable={isEditMode} className="contact-label" />
              <EditableText value={contact.value} onChange={(value) => updateList<Contact>("contacts", index, "value", value)} editable={isEditMode} className="contact-value" />
            </div>
          ))}
        </div>
      </section>

      <button className="chat-launcher" type="button" onClick={() => setIsChatOpen(true)} aria-label={profile.aiTitle}>
        AI
      </button>

      {isChatOpen && (
        <section className="chat-panel" aria-label={profile.aiTitle}>
          <div className="chat-header">
            <div>
              <EditableText value={profile.aiTitle} onChange={(value) => updateField("aiTitle", value)} editable={isEditMode} as="h2" />
              <EditableText value={profile.aiIntro} onChange={(value) => updateField("aiIntro", value)} editable={isEditMode} as="p" multiline />
            </div>
            <button type="button" onClick={() => setIsChatOpen(false)} aria-label={language === "zh" ? "关闭聊天" : "Close chat"}>
              x
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <p className={`message ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </p>
            ))}
          </div>
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={language === "zh" ? "问问我的成长背景或项目..." : "Ask about my story or projects..."}
            />
            <button type="submit">{language === "zh" ? "发送" : "Send"}</button>
          </form>
        </section>
      )}
    </main>
  );
}

function getEditStatusText(language: Language, saveState: SaveState): string {
  const copy = {
    zh: {
      idle: "编辑模式已开启。运行 npm run edit 时，修改会写入 src/content.json。",
      saving: "正在保存到本地内容文件...",
      saved: "已保存到 src/content.json。",
      "browser-fallback": "未连接本地编辑后台，修改仅暂存在当前浏览器。",
      error: "保存失败，请检查本地编辑后台。",
    },
    en: {
      idle: "Edit mode is on. With npm run edit, changes are written to src/content.json.",
      saving: "Saving to local content file...",
      saved: "Saved to src/content.json.",
      "browser-fallback": "Local edit backend is unavailable. Changes are only saved in this browser.",
      error: "Save failed. Check the local edit backend.",
    },
  };

  return copy[language][saveState];
}

function EditableText({
  value,
  onChange,
  editable,
  as = "span",
  className = "",
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  multiline?: boolean;
}) {
  if (editable) {
    return multiline ? (
      <textarea className={`editable ${className}`} value={value} onChange={(event) => onChange(event.target.value)} />
    ) : (
      <input className={`editable ${className}`} value={value} onChange={(event) => onChange(event.target.value)} />
    );
  }

  const Tag = as;
  return <Tag className={className}>{value}</Tag>;
}

function SectionHeader({
  title,
  editable,
  onChange,
}: {
  title: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="section-header">
      <EditableText value={title} onChange={onChange} editable={editable} as="h2" />
      <span />
    </div>
  );
}

function Field({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <strong>{label}</strong>
      <EditableText value={value} onChange={onChange} editable={editable} as="p" multiline />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
