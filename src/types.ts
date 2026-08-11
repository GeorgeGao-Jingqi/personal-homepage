export type Language = "zh" | "en";

export type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

export type Metric = {
  value: string;
  label: string;
  detail: string;
};

export type EditableListKey = "metrics" | "projects" | "skills" | "experience" | "contacts";

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
  metrics: Metric[];
  projects: Project[];
  skills: SkillGroup[];
  experience: Experience[];
  contacts: Contact[];
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
  | "aiIntro";

export type Content = Record<Language, ProfileContent>;
