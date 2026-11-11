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

export const quizExample: EventMemory = {
  id: "memo-6.5",
  cover: { src: "/memories/memo-6.5/photos/background.png", alt: "問答背景圖片" },
  song: { title: "Quiz Theme", artist: "Example Artist", src: "/memories/memo-6.5/audio/song.mp3" },
  lines: [],
  quiz: {
    title: "回憶問答",
    progressLabel: "第 {current} 題，共 {total} 題",
    result: {
      waitingText: "結果即將揭曉……",
      correctTitle: "你答對了！！",
      incorrectTitle: "你答錯了！！",
      questionLabel: "第 {number} 題",
      correctLabel: "答對",
      incorrectLabel: "答錯",
      drumSrc: "/memories/memo-6.5/audio/drumroll.wav",
    },
    questions: [{
      prompt: "在這裡填寫題目",
      options: [{ id: "A", text: "第一個選項" }, { id: "B", text: "第二個選項" }, { id: "C", text: "第三個選項" }],
      answer: "A",
    }],
  },
};
