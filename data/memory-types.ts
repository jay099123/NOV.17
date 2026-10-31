export type Palette = "lime" | "pink" | "blue" | "orange" | "violet";
// JSON accepts Tailwind names (yellow-300, white) or hex; the loader resolves them to CSS colors.
export type PageColors = {
  background: string;
  photoBackground: string;
  text: string;
  bodyText?: string;
};
export type Photo = { src: string; alt: string; caption: string };
export type Song = { title: string; artist: string; src: string };
export type Homepage = {
  name: string;
  greeting: string;
  startText: string;
  startIcon?: string;
  intro?: { lines: string[]; playLabel: string };
  musicHint: string;
  musicPlayingText: string;
  palette?: Palette;
  colors?: PageColors;
  photo: Pick<Photo, "src" | "alt">;
  song: Song;
  isSample: boolean;
};
export type Question = { prompt: string; options: string[]; answer: number; reveal: string };
export type Memory = {
  id: string;
  year: number;
  month: string;
  english: string;
  label: string;
  title: [string, string];
  body: string;
  note: string;
  palette?: Palette;
  colors?: PageColors;
  kind: "story" | "concert" | "quiz" | "little-things" | "birthday";
  photos: Photo[];
  song: Song;
  concert?: { number: number; name: string; venue: string };
  quiz?: Question;
  interaction?: { action: string; reveal: string };
  letter?: string;
};
