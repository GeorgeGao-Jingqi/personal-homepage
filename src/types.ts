export type Language = "zh" | "en";

export type NoteKind = "thinking" | "learning" | "reading";

export type NoteStatus = "draft" | "editing" | "published" | "archived";

export type GardenNote = {
  slug: string;
  type: NoteKind;
  status: NoteStatus;
  title: string;
  summary: string;
  date: string;
  updated: string;
  tags: string[];
  related: string[];
  source?: string;
  sourceUrl?: string;
  body: string;
};

export type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

export type Metric = {
  value: string;
  label: string;
  detail: string;
};

export type EditableListKey = "metrics" | "projects" | "skills" | "experience" | "contacts" | "interests";

export type Project = {
  title: string;
  problem: string;
  approach: string;
  impact: string;
  tools: string;
};

export type SkillGroup = {
  title: string;
  items: string;
};

export type Experience = {
  title: string;
  detail: string;
};

export type Contact = {
  label: string;
  value: string;
};

export type Interest = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  details: string;
  keywords: string;
};

export type ProfileContent = {
  name: string;
  role: string;
  tagline: string;
  intro: string;
  heroNote: string;
  storyTitle: string;
  story: string;
  storyAside: string;
  projectsTitle: string;
  projectsIntro: string;
  skillsTitle: string;
  skillsIntro: string;
  experienceTitle: string;
  experienceNote: string;
  contactTitle: string;
  contactLead: string;
  aiTitle: string;
  aiIntro: string;
  interestsTitle: string;
  interestsIntro: string;
  metrics: Metric[];
  projects: Project[];
  skills: SkillGroup[];
  experience: Experience[];
  contacts: Contact[];
  interests: Interest[];
};

export type ProfileTextField =
  | "name"
  | "role"
  | "tagline"
  | "intro"
  | "heroNote"
  | "storyTitle"
  | "story"
  | "storyAside"
  | "projectsTitle"
  | "projectsIntro"
  | "skillsTitle"
  | "skillsIntro"
  | "experienceTitle"
  | "experienceNote"
  | "contactTitle"
  | "contactLead"
  | "aiTitle"
  | "aiIntro"
  | "interestsTitle"
  | "interestsIntro";

export type Content = Record<Language, ProfileContent>;
