import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import defaultContentData from "./content.json";
import { ChatPanel } from "./components/ChatPanel";
import { DigitalGarden } from "./components/DigitalGarden";
import { getPublicNotes } from "./notes";
import type {
  ChatMessage,
  Content,
  EditableListKey,
  Language,
  ProfileContent,
  ProfileTextField,
} from "./types";
import "./styles.css";

type SaveState = "idle" | "saving" | "saved" | "browser-fallback" | "error";

const STORAGE_KEY = "resume-homepage-content-draft-v1";
const defaultContent = defaultContentData as Content;

function isProfileShape(value: unknown): value is ProfileContent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ProfileContent>;
  return Boolean(
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
      Array.isArray(candidate.contacts),
  );
}

function hasProfileShape(content: unknown): content is Content {
  if (!content || typeof content !== "object") return false;
  const candidate = content as Partial<Content>;
  return isProfileShape(candidate.zh) && isProfileShape(candidate.en);
}

function getInitialContent(isEditMode: boolean): Content {
  if (!isEditMode) return defaultContent;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? (JSON.parse(saved) as unknown) : null;
    return hasProfileShape(parsed) ? parsed : defaultContent;
  } catch {
    return defaultContent;
  }
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
  const publicNotes = getPublicNotes();

  if (text.includes("笔记") || text.includes("thinking") || text.includes("learning") || text.includes("reading") || text.includes("知识")) {
    const noteTitles = publicNotes.slice(0, 3).map((note) => `「${note.title}」`).join("、");
    return isChinese
      ? `这个数字花园目前有 ${publicNotes.length} 篇公开笔记，最近可以从 ${noteTitles} 开始。你也可以按 Thinking Notes、Learning Log 或 Reading Notes 浏览。`
      : `The garden currently has ${publicNotes.length} public notes. Start with ${publicNotes.slice(0, 3).map((note) => `"${note.title}"`).join(", ")}, then browse by Thinking Notes, Learning Log, or Reading Notes.`;
  }

  if (text.includes("项目") || text.includes("project")) {
    const project = profile.projects[0];
    return isChinese
      ? `可以先看「${project.title}」。它体现了我如何从业务问题出发：${project.problem} 我的做法是${project.approach}，最后产出是${project.impact}`
      : `A good example is "${project.title}". It shows how I start from a business problem: ${project.problem} My approach was: ${project.approach} The outcome was: ${project.impact}`;
  }

  if (text.includes("技能") || text.includes("工具") || text.includes("skill") || text.includes("tool")) {
    return isChinese
      ? `我的技能主要集中在 ${profile.skills.map((skill) => skill.title).join("、")}。如果你是招聘方，我建议重点看项目卡里的“问题-方法-影响”，那里更能说明这些工具如何被使用。`
      : `My skills are mainly around ${profile.skills.map((skill) => skill.title).join(", ")}. The project cards show how those tools are used in context.`;
  }

  if (text.includes("成长") || text.includes("背景") || text.includes("story") || text.includes("background")) return profile.story;

  if (text.includes("联系") || text.includes("contact") || text.includes("email")) {
    const email = profile.contacts.find((item) => item.label.toLowerCase() === "email");
    return isChinese ? `你可以通过 ${email?.value ?? "页面底部的联系方式"} 联系我。` : `You can reach me at ${email?.value ?? "the contact links at the bottom of the page"}.`;
  }

  return isChinese
    ? `我可以介绍 ${profile.name} 的成长背景、数据分析项目、数字花园笔记、技能工具和求职方向。你可以试着问：“这个数字花园记录了什么？”`
    : `I can talk about ${profile.name}'s growth story, analytics projects, digital garden notes, skills, and career direction. Try asking: "What does this digital garden contain?"`;
}

function getAssistantGreeting(language: Language): string {
  return language === "zh"
    ? "你好，我可以帮你了解这个人的成长背景、项目成果，以及数字花园里的思考、学习和阅读记录。"
    : "Hello, I can introduce this person's growth story, projects, and notes from the digital garden.";
}

function App() {
  const isEditMode = useMemo(() => new URLSearchParams(window.location.search).get("edit") === "1", []);
  const [content, setContent] = useState<Content>(() => getInitialContent(isEditMode));
  const [language, setLanguage] = useState<Language>("zh");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: getAssistantGreeting("zh") },
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
      .catch(() => setSaveState("browser-fallback"));
  }, [isEditMode]);

  function saveContent(next: Content) {
    setContent(next);
    if (!isEditMode) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaveState("saving");
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        const didSaveToFile = await persistFileContent(next);
        setSaveState(didSaveToFile ? "saved" : "browser-fallback");
      })
      .catch(() => setSaveState("browser-fallback"));
  }

  function updateField(field: ProfileTextField, value: string) {
    void saveContent({ ...content, [language]: { ...profile, [field]: value } });
  }

  function updateList(key: EditableListKey, index: number, field: string, value: string) {
    const nextProfile = { ...profile };

    switch (key) {
      case "metrics":
        nextProfile.metrics = profile.metrics.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
        break;
      case "projects":
        nextProfile.projects = profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
        break;
      case "skills":
        nextProfile.skills = profile.skills.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
        break;
      case "experience":
        nextProfile.experience = profile.experience.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
        break;
      case "contacts":
        nextProfile.contacts = profile.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
        break;
    }

    void saveContent({ ...content, [language]: nextProfile });
  }

  function resetContent() {
    localStorage.removeItem(STORAGE_KEY);
    void saveContent(defaultContent);
  }

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }, { role: "assistant", text: getAiReply(trimmed, profile, language) }]);
    setInput("");
  }

  function toggleLanguage() {
    const nextLanguage = language === "zh" ? "en" : "zh";
    setLanguage(nextLanguage);
    setMessages((current) => current.length === 1 ? [{ role: "assistant", text: getAssistantGreeting(nextLanguage) }] : current);
  }

  return (
    <>
      <DigitalGarden
        content={content}
        profile={profile}
        language={language}
        editable={isEditMode}
        onFieldChange={updateField}
        onListChange={updateList}
        onOpenChat={() => setIsChatOpen(true)}
        onToggleLanguage={toggleLanguage}
        isEditMode={isEditMode}
        editStatus={getEditStatusText(language, saveState)}
        onResetContent={resetContent}
      />

      <button className="chat-launcher" type="button" onClick={() => setIsChatOpen(true)} aria-label={profile.aiTitle}>
        <span aria-hidden="true">AI</span>
      </button>

      {isChatOpen && (
        <ChatPanel
          profile={profile}
          language={language}
          editable={isEditMode}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={sendMessage}
          onClose={() => setIsChatOpen(false)}
          onTitleChange={(value) => updateField("aiTitle", value)}
          onIntroChange={(value) => updateField("aiIntro", value)}
        />
      )}
    </>
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
