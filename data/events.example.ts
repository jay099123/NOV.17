// Fictional event template. Personal content belongs in public/memories/memo-N/content.json.
import type { EventMemory } from "./memory-types";

export const eventExample: EventMemory = {
  id: "memo-1",
  cover: { src: "/memories/memo-1/photos/cover.jpg", alt: "示意專輯封面" },
  song: { title: "Our First Track", artist: "Example Artist — Example Album", src: "/memories/memo-1/audio/song.mp3" },
  lines: Array.from({ length: 10 }, (_, index) => `在這裡填寫第 ${index + 1} 行文字`),
  photos: [
    { src: "/memories/memo-1/photos/photo-01.jpg", alt: "第一張回憶照片" },
    { src: "/memories/memo-1/photos/photo-02.jpg", alt: "第二張回憶照片" },
  ],
};
