import type { Photo, PhotoAlbum } from "./types";

const rawAlbums = import.meta.glob("../content/photos/albums/*.json", { eager: true, import: "default" }) as Record<string, PhotoAlbum>;
const rawPhotos = import.meta.glob("../content/photos/items/*.json", { eager: true, import: "default" }) as Record<string, Photo>;

function validStatus(value: unknown): value is Photo["status"] {
  return value === "draft" || value === "editing" || value === "published" || value === "archived";
}

function validPhoto(value: unknown): value is Photo {
  if (!value || typeof value !== "object") return false;
  const photo = value as Partial<Photo>;
  return Boolean(
    typeof photo.slug === "string" && typeof photo.album === "string" && validStatus(photo.status) &&
    typeof photo.title === "string" && typeof photo.date === "string" && typeof photo.location === "string" &&
    Array.isArray(photo.tags) && typeof photo.description === "string" && typeof photo.alt === "string" &&
    typeof photo.image === "string" && typeof photo.thumbnail === "string" &&
    typeof photo.width === "number" && typeof photo.height === "number",
  );
}

export const albums = Object.values(rawAlbums).filter((album): album is PhotoAlbum => Boolean(album?.slug && album.title)).sort((a, b) => a.order - b.order);
export const photos = Object.values(rawPhotos).filter(validPhoto).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
export const getPublicPhotos = () => photos.filter((photo) => photo.status === "published");
export const findAlbum = (slug: string) => albums.find((album) => album.slug === slug);
export const findPhoto = (album: string, slug: string, editable = false) => (editable ? photos : getPublicPhotos()).find((photo) => photo.album === album && photo.slug === slug);
export const photosForAlbum = (album: string, editable = false) => (editable ? photos : getPublicPhotos()).filter((photo) => photo.album === album);
