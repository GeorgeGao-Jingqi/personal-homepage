export type Language = "zh" | "en";

export type NoteKind = "thinking" | "learning" | "reading";
export type NoteStatus = "draft" | "editing" | "published" | "archived";

export type GardenNote = {
  slug: string;
  type: NoteKind;
  status: NoteStatus;
  publish: boolean;
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

export type GardenNoteFrontmatter = Omit<GardenNote, "slug" | "type" | "body">;
export type GardenNoteDocument = { frontmatter: GardenNoteFrontmatter; body: string };

export type PhotoAlbum = {
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  cover?: string;
  order: number;
};

export type Photo = {
  slug: string;
  album: string;
  status: NoteStatus;
  title: string;
  date: string;
  location: string;
  tags: string[];
  description: string;
  alt: string;
  image: string;
  thumbnail: string;
  width: number;
  height: number;
};

export type PhotoDocument = Omit<Photo, "thumbnail" | "width" | "height">;

export type SiteCopy = {
  title: string;
  subtitle: string;
  intro: string;
  contactLabel: string;
  contactValue: string;
};

export type SiteContent = Record<Language, SiteCopy>;
