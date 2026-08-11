import heroWorkspace from "../../assets/hero-workspace.png";
import type {
  Contact,
  EditableListKey,
  Experience,
  Language,
  Metric,
  ProfileContent,
  ProfileTextField,
  Project,
} from "../types";
import { EditableText } from "./EditableText";
import { Field } from "./Field";
import { SectionHeader } from "./SectionHeader";

type ProfileSectionsProps = {
  profile: ProfileContent;
  language: Language;
  editable: boolean;
  onFieldChange: (field: ProfileTextField, value: string) => void;
  onListChange: (key: EditableListKey, index: number, field: string, value: string) => void;
  onOpenChat: () => void;
};

export function HeroSection({
  profile,
  language,
  editable,
  onFieldChange,
  onListChange,
  onOpenChat,
}: ProfileSectionsProps) {
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <div className="hero-kicker">
          <span className="hero-kicker-mark" aria-hidden="true" />
          <EditableText value={profile.role} onChange={(value) => onFieldChange("role", value)} editable={editable} className="eyebrow" />
          <span className="hero-kicker-code">01 / 06</span>
        </div>
        <EditableText value={profile.name} onChange={(value) => onFieldChange("name", value)} editable={editable} as="h1" />
        <EditableText
          value={profile.tagline}
          onChange={(value) => onFieldChange("tagline", value)}
          editable={editable}
          as="p"
          className="tagline"
          multiline
        />
        <EditableText
          value={profile.intro}
          onChange={(value) => onFieldChange("intro", value)}
          editable={editable}
          as="p"
          className="intro"
          multiline
        />
        <div className="hero-actions">
          <a className="primary-link" href="#projects">
            {language === "zh" ? "查看项目成果" : "View projects"}
            <span aria-hidden="true">↗</span>
          </a>
          <button className="secondary-link" type="button" onClick={onOpenChat}>
            {language === "zh" ? "打开 AI 对话" : "Open AI chat"}
          </button>
        </div>
      </div>

      <div className="hero-visual">
        <img className="hero-image" src={heroWorkspace} alt="" />
        <div className="visual-note">
          <EditableText value={profile.heroNote} onChange={(value) => onFieldChange("heroNote", value)} editable={editable} className="visual-note-text" />
          <span className="visual-note-line" aria-hidden="true" />
        </div>
        <div className="visual-stamp" aria-hidden="true">
          <span>GG</span>
          <small>DATA<br />NOTES</small>
        </div>
      </div>

      <div className="metrics-strip" aria-label={language === "zh" ? "个人指标" : "Personal metrics"}>
        {profile.metrics.map((metric, index) => (
          <MetricCard
            key={`${metric.label}-${index}`}
            metric={metric}
            index={index}
            editable={editable}
            onChange={(field, value) => onListChange("metrics", index, field, value)}
          />
        ))}
      </div>
    </section>
  );
}

function MetricCard({
  metric,
  index,
  editable,
  onChange,
}: {
  metric: Metric;
  index: number;
  editable: boolean;
  onChange: (field: keyof Metric, value: string) => void;
}) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span className="metric-index">0{index + 1}</span>
        <span className="metric-signal" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <EditableText value={metric.value} onChange={(value) => onChange("value", value)} editable={editable} as="h3" className="metric-value" />
      <EditableText value={metric.label} onChange={(value) => onChange("label", value)} editable={editable} as="p" className="metric-label" />
      <EditableText
        value={metric.detail}
        onChange={(value) => onChange("detail", value)}
        editable={editable}
        as="p"
        className="metric-detail"
        multiline
      />
    </article>
  );
}

export function StorySection({ profile, language, editable, onFieldChange }: ProfileSectionsProps) {
  return (
    <section className="section story" id="story">
      <SectionHeader title={profile.storyTitle} editable={editable} onChange={(value) => onFieldChange("storyTitle", value)} index="02" />
      <div className="story-layout">
        <div className="story-mark" aria-hidden="true">
          <span>WHY</span>
          <span className="story-mark-line" />
        </div>
        <EditableText value={profile.story} onChange={(value) => onFieldChange("story", value)} editable={editable} as="p" multiline className="story-text" />
        <EditableText value={profile.storyAside} onChange={(value) => onFieldChange("storyAside", value)} editable={editable} as="p" multiline className="story-aside" />
      </div>
    </section>
  );
}

export function ProjectsSection({ profile, language, editable, onFieldChange, onListChange }: ProfileSectionsProps) {
  return (
    <section className="section" id="projects">
      <SectionHeader title={profile.projectsTitle} editable={editable} onChange={(value) => onFieldChange("projectsTitle", value)} index="03" />
      <div className="section-intro-row">
        <EditableText value={profile.projectsIntro} onChange={(value) => onFieldChange("projectsIntro", value)} editable={editable} as="p" multiline />
        <span>{String(profile.projects.length).padStart(2, "0")} {language === "zh" ? "个案例" : "case studies"}</span>
      </div>
      <div className="project-grid">
        {profile.projects.map((project, index) => (
          <ProjectCard
            key={`${project.title}-${index}`}
            project={project}
            index={index}
            language={language}
            editable={editable}
            onChange={(field, value) => onListChange("projects", index, field, value)}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  language,
  editable,
  onChange,
}: {
  project: Project;
  index: number;
  language: Language;
  editable: boolean;
  onChange: (field: keyof Project, value: string) => void;
}) {
  return (
    <article className="project-card">
      <div className="project-card-top">
        <span className="card-number">0{index + 1} / CASE</span>
        <EditableText value={project.tools} onChange={(value) => onChange("tools", value)} editable={editable} className="tool-pill" />
      </div>
      <EditableText value={project.title} onChange={(value) => onChange("title", value)} editable={editable} as="h3" />
      <div className="project-fields">
        <Field label={language === "zh" ? "问题" : "Problem"} value={project.problem} editable={editable} onChange={(value) => onChange("problem", value)} />
        <Field label={language === "zh" ? "方法" : "Approach"} value={project.approach} editable={editable} onChange={(value) => onChange("approach", value)} />
        <Field label={language === "zh" ? "影响" : "Impact"} value={project.impact} editable={editable} onChange={(value) => onChange("impact", value)} />
      </div>
      <div className="project-footer">
        <span>{language === "zh" ? "分析记录" : "Analysis note"}</span>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  );
}

export function SkillsSection({ profile, language, editable, onFieldChange, onListChange }: ProfileSectionsProps) {
  return (
    <section className="section skills-section" id="skills">
      <SectionHeader title={profile.skillsTitle} editable={editable} onChange={(value) => onFieldChange("skillsTitle", value)} index="04" />
      <div className="section-intro-row">
        <EditableText value={profile.skillsIntro} onChange={(value) => onFieldChange("skillsIntro", value)} editable={editable} as="p" multiline />
      </div>
      <div className="skills-grid">
        {profile.skills.map((skill, index) => (
          <article className="skill-card" key={`${skill.title}-${index}`}>
            <span className="skill-step">STEP 0{index + 1}</span>
            <EditableText value={skill.title} onChange={(value) => onListChange("skills", index, "title", value)} editable={editable} as="h3" />
            <EditableText value={skill.items} onChange={(value) => onListChange("skills", index, "items", value)} editable={editable} as="p" multiline />
            {index < profile.skills.length - 1 && <span className="skill-connector" aria-hidden="true">→</span>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ExperienceSection({ profile, language, editable, onFieldChange, onListChange }: ProfileSectionsProps) {
  return (
    <section className="section experience-section">
      <SectionHeader title={profile.experienceTitle} editable={editable} onChange={(value) => onFieldChange("experienceTitle", value)} index="05" />
      <div className="timeline">
        {profile.experience.map((item, index) => (
          <article className="timeline-item" key={`${item.title}-${index}`}>
            <span className="timeline-index">0{index + 1}</span>
            <div>
              <EditableText value={item.title} onChange={(value) => onListChange("experience", index, "title", value)} editable={editable} as="h3" />
              <EditableText value={item.detail} onChange={(value) => onListChange("experience", index, "detail", value)} editable={editable} as="p" multiline />
            </div>
          </article>
        ))}
      </div>
      <EditableText value={profile.experienceNote} onChange={(value) => onFieldChange("experienceNote", value)} editable={editable} as="p" multiline className="timeline-note" />
    </section>
  );
}

export function ContactSection({ profile, language, editable, onFieldChange, onListChange }: ProfileSectionsProps) {
  return (
    <section className="section contact" id="contact">
      <SectionHeader title={profile.contactTitle} editable={editable} onChange={(value) => onFieldChange("contactTitle", value)} index="06" />
      <div className="contact-layout">
        <EditableText value={profile.contactLead} onChange={(value) => onFieldChange("contactLead", value)} editable={editable} as="p" multiline className="contact-lead" />
        <div className="contact-links">
          {profile.contacts.map((contact, index) => (
            <ContactItem
              key={`${contact.label}-${index}`}
              contact={contact}
              editable={editable}
              onChange={(field, value) => onListChange("contacts", index, field, value)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactItem({
  contact,
  editable,
  onChange,
}: {
  contact: Contact;
  editable: boolean;
  onChange: (field: keyof Contact, value: string) => void;
}) {
  const href = contact.label.toLowerCase() === "email" ? `mailto:${contact.value}` : contact.value;
  const isExternalLink = href.startsWith("http");

  return (
    <div className="contact-item">
      <EditableText value={contact.label} onChange={(value) => onChange("label", value)} editable={editable} className="contact-label" />
      {editable ? (
        <EditableText value={contact.value} onChange={(value) => onChange("value", value)} editable={editable} className="contact-value" />
      ) : (
        <a className="contact-value" href={href} target={isExternalLink ? "_blank" : undefined} rel={isExternalLink ? "noreferrer" : undefined}>
          {contact.value}
        </a>
      )}
    </div>
  );
}
