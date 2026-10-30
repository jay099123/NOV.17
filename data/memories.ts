// Public loader only. Personal content belongs in the Git-ignored public/homepage/ and public/memories/.
import homepage from "../public/homepage/content.json";
import november2025 from "../public/memories/2025-11/content.json";
import december2025 from "../public/memories/2025-12/content.json";
import january2026 from "../public/memories/2026-01/content.json";
import february2026 from "../public/memories/2026-02/content.json";
import march2026 from "../public/memories/2026-03/content.json";
import april2026 from "../public/memories/2026-04/content.json";
import may2026 from "../public/memories/2026-05/content.json";
import june2026 from "../public/memories/2026-06/content.json";
import july2026 from "../public/memories/2026-07/content.json";
import august2026 from "../public/memories/2026-08/content.json";
import september2026 from "../public/memories/2026-09/content.json";
import october2026 from "../public/memories/2026-10/content.json";
import november2026 from "../public/memories/2026-11/content.json";
import type { Homepage, Memory, Palette } from "./memory-types";

const palettes: Palette[] = ["lime", "pink", "blue", "orange", "violet"];
const homepagePalette = palettes.find(value => value === homepage.palette);
if (!homepagePalette) throw new Error("public/homepage/content.json: unsupported palette.");
export const project: Homepage = { ...homepage, palette: homepagePalette };
const kinds: Memory["kind"][] = ["story", "concert", "quiz", "little-things", "birthday"];
const months = [november2025, december2025, january2026, february2026, march2026, april2026, may2026, june2026, july2026, august2026, september2026, october2026, november2026];

export const memories: Memory[] = months.map((content, index): Memory => {
  const date = new Date(Date.UTC(2025, 10 + index, 1));
  const id = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `public/memories/${id}/content.json`;
  if (content.id !== id) throw new Error(`${filename}: id must match the month folder.`);
  if (!Array.isArray(content.title) || content.title.length !== 2 || content.title.some(line => typeof line !== "string")) {
    throw new Error(`${filename}: title must contain exactly two text lines.`);
  }
  if (!Array.isArray(content.photos) || content.photos.length === 0) throw new Error(`${filename}: at least one photo is required.`);
  const palette = palettes.find(value => value === content.palette);
  const kind = kinds.find(value => value === content.kind);
  if (!palette || !kind) throw new Error(`${filename}: unsupported palette or kind.`);
  return { ...content, title: [content.title[0], content.title[1]], palette, kind };
});
