export type Language = "zh" | "en";

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
  storyTitle: string;
  story: string;
  projectsTitle: string;
  skillsTitle: string;
  experienceTitle: string;
  contactTitle: string;
  aiTitle: string;
  aiIntro: string;
  projects: Project[];
  skills: SkillGroup[];
  experience: Experience[];
  contacts: Contact[];
};

export type Content = Record<Language, ProfileContent>;
