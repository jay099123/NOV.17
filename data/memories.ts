// Public loader only. Personal content belongs in the Git-ignored public/homepage/ and public/memories/.
import tailwindColors from "tailwindcss/colors";
import homepage from "../public/homepage/content.json";
import event1 from "../public/memories/memo-1/content.json";
import event2 from "../public/memories/memo-2/content.json";
import event3 from "../public/memories/memo-3/content.json";
import event4 from "../public/memories/memo-4/content.json";
import event5 from "../public/memories/memo-5/content.json";
import event6 from "../public/memories/memo-6/content.json";
import event7 from "../public/memories/memo-7/content.json";
import event8 from "../public/memories/memo-8/content.json";
import event9 from "../public/memories/memo-9/content.json";
import event99 from "../public/memories/memo-99/content.json";
import type { EventMemory, Homepage, PageColors, Palette, StatsContent } from "./memory-types";

const palettes: Palette[] = ["lime", "pink", "blue", "orange", "violet"];
const namedColors: Record<string, string> = Object.fromEntries(
  Object.entries(tailwindColors).flatMap(([name, color]) => typeof color === "string"
    ? [[name, color]]
    : Object.entries(color).map(([shade, value]) => [`${name}-${shade}`, value])),
);
// Legacy palette names remain optional; per-page colors override their defaults.
function readTheme(content: { palette?: unknown; colors?: unknown }, filename: string): { palette: Palette; colors?: PageColors } {
  const palette = content.palette === undefined ? "lime" : palettes.find(value => value === content.palette);
  if (!palette) throw new Error(`${filename}: unsupported palette. Use colors to enter Tailwind color names or hex codes.`);
  if (content.colors === undefined) return { palette };
  if (!content.colors || typeof content.colors !== "object" || Array.isArray(content.colors)) {
    throw new Error(`${filename}: colors must be an object.`);
  }
  const values = content.colors as Record<string, unknown>;
  const readColor = (key: keyof PageColors): string => {
    const value = values[key];
    if (typeof value === "string") {
      const color = value.trim();
      if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return color;
      if (Object.hasOwn(namedColors, color)) return namedColors[color];
    }
    throw new Error(`${filename}: colors.${key} must be a Tailwind color such as yellow-300 (without bg-/text-) or a hex color such as #ffe1ec.`);
  };
  return { palette, colors: {
    background: readColor("background"),
    photoBackground: readColor("photoBackground"),
    text: readColor("text"),
    ...(values.bodyText === undefined ? {} : { bodyText: readColor("bodyText") }),
  } };
}

function readStats(content: unknown): StatsContent {
  const filename = "public/homepage/content.json: stats";
  if (!content || typeof content !== "object") throw new Error(`${filename} must be an object.`);
  const { since, lines, playLabel } = content as Record<string, unknown>;
  if (typeof since !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/.test(since) || !Number.isFinite(Date.parse(since))) {
    throw new Error(`${filename}.since must be an ISO date with an explicit timezone.`);
  }
  if (!Array.isArray(lines) || lines.length !== 3 || lines.some(line => typeof line !== "string")) {
    throw new Error(`${filename}.lines must contain exactly three text lines.`);
  }
  if (typeof playLabel !== "string" || !playLabel.trim()) throw new Error(`${filename}.playLabel is required.`);
  return { since, lines: [lines[0], lines[1], lines[2]], playLabel };
}

export const project: Homepage = { ...homepage, stats: readStats(homepage.stats), ...readTheme(homepage, "public/homepage/content.json") };
const eventContents = [
  ["memo-1", event1],
  ["memo-2", event2],
  ["memo-3", event3],
  ["memo-4", event4],
  ["memo-5", event5],
  ["memo-6", event6],
  ["memo-7", event7],
  ["memo-8", event8],
  ["memo-9", event9],
  ["memo-99", event99],
] as const;

export const events: EventMemory[] = eventContents.map(([id, content]) => {
  const filename = `public/memories/${id}/content.json`;
  if (content.id !== id) throw new Error(`${filename}: id must be ${id}.`);
  if (!content.cover || typeof content.cover.src !== "string" || !content.cover.src.trim() || typeof content.cover.alt !== "string") {
    throw new Error(`${filename}: cover.src and cover.alt are required.`);
  }
  if (!content.song || [content.song.src, content.song.title, content.song.artist].some(value => typeof value !== "string") || !content.song.src.trim()) {
    throw new Error(`${filename}: song.src, song.title and song.artist are required.`);
  }
  if (!Array.isArray(content.lines) || content.lines.some(line => typeof line !== "string")) {
    throw new Error(`${filename}: lines must be an array of text lines.`);
  }
  const photos = "photos" in content ? content.photos : undefined;
  if (photos !== undefined && (!Array.isArray(photos) || photos.some(photo => !photo || typeof photo.src !== "string" || !photo.src.trim() || typeof photo.alt !== "string"))) {
    throw new Error(`${filename}: photos must be an array with src and alt for each photo.`);
  }
  return content;
});
