import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadMemoryData } from "./load-memory-data.mjs";

const { memories, project } = loadMemoryData();
const baseURL = process.env.NOV17_TEST_URL || "http://127.0.0.1:3000";
const qa = new URL("../.qa/", import.meta.url);
mkdirSync(qa, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const expectedMonths = Array.from({ length: 13 }, (_, i) => {
  const date = new Date(Date.UTC(2025, 10 + i, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
});
const fullWindowSlide = async (page, label) => {
  const geometry = await page.evaluate(() => {
    const stage = document.querySelector('.story-stage').getBoundingClientRect();
    const navigation = document.querySelector('.slide-navigation').getBoundingClientRect();
    const homeTitle = document.querySelector('.homepage-title');
    const brand = (document.querySelector('.wordmark') || homeTitle).getBoundingClientRect();
    return { isHome: Boolean(homeTitle), width: innerWidth, height: innerHeight, stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height }, navigation: { top: navigation.top, bottom: navigation.bottom, left: navigation.left, right: navigation.right }, brand: { top: brand.top, left: brand.left, right: brand.right, bottom: brand.bottom }, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight };
  });
  expect(geometry.stage.x, `${label}: left edge`).toBeCloseTo(0, 0);
  expect(geometry.stage.y, `${label}: top edge`).toBeCloseTo(0, 0);
  expect(geometry.stage.width, `${label}: slide width`).toBeCloseTo(geometry.width, 0);
  expect(geometry.stage.height, `${label}: slide height`).toBeCloseTo(geometry.height, 0);
  expect(geometry.navigation.top, `${label}: navigation at bottom`).toBeGreaterThan(geometry.height - 150);
  expect(geometry.navigation.bottom).toBeLessThanOrEqual(geometry.height);
  expect(geometry.navigation.left).toBeGreaterThanOrEqual(0);
  expect(geometry.navigation.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.brand.top).toBeGreaterThanOrEqual(0);
  expect(geometry.brand.left).toBeGreaterThanOrEqual(0);
  expect(geometry.brand.right).toBeLessThanOrEqual(geometry.width);
  if (geometry.isHome) expect((geometry.brand.left + geometry.brand.right) / 2).toBeCloseTo(geometry.width / 2, 0);
  else expect(geometry.brand.bottom).toBeLessThan(100);
  expect(geometry.scrollWidth, `${label}: no document horizontal scroll`).toBeLessThanOrEqual(geometry.width);
  expect(geometry.scrollHeight, `${label}: no document vertical scroll`).toBeLessThanOrEqual(geometry.height);
};
const waitPhotos = async (page) => {
  await page.locator('[data-photo-src]').evaluateAll(async (elements) => {
    await Promise.all([...new Set(elements.map((element) => element.dataset.photoSrc))].map(async (src) => { const image = new Image(); image.src = src; await image.decode(); }));
  });
  await expect.poll(() => page.locator('.photo-visual, .homepage-cutout').evaluateAll(elements => elements
    .filter(element => element.getClientRects().length > 0)
    .every(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0 && getComputedStyle(element).objectFit === 'contain'))).toBe(true);
  expect(await page.locator('.photo-frame').evaluateAll(frames => frames
    .filter(frame => frame.getClientRects().length > 0)
    .every(frame => {
      const image = frame.querySelector('.photo-window');
      const caption = frame.querySelector('figcaption');
      return image.offsetTop + image.offsetHeight <= caption.offsetTop + 1;
    })), 'Photo captions must not cover the image').toBe(true);
};
const screenshot = async (page, name) => { await page.waitForTimeout(250); await waitPhotos(page); await page.screenshot({ path: new URL(name, qa).pathname, fullPage: true }); };

try {
  expect(memories.map((memory) => memory.id)).toEqual(expectedMonths);
  expect(new Set(memories.map((memory) => memory.song.src)).size).toBe(13);
  for (const photo of [project.photo, ...memories.flatMap(memory => memory.photos)]) {
    expect(photo).not.toHaveProperty('tile');
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle(/NOV\.17/);
  await expect(page.getByTestId("start")).toBeVisible();
  await expect(page.locator(".month-timeline button")).toHaveCount(13);
  await expect(page.locator('.story-stage > .slide-navigation .month-button')).toHaveCount(13);
  await expect(page.locator('.wordmark')).toHaveCount(0);
  await expect(page.locator('.homepage-title')).toHaveText(project.name);
  await expect(page.locator('.homepage-greeting')).toHaveText(project.greeting);
  await expect(page.locator('.homepage-cutout')).toHaveAttribute('src', project.photo.src);
  await expect(page.locator('.music-player, .header-nav, .chapter-controls, .site-footer, .stage-ribbon, .info-modal, .track-title, audio[controls]')).toHaveCount(0);
  await fullWindowSlide(page, 'desktop cover');
  await screenshot(page, "desktop-cover.png");

  const homeAudio = page.getByTestId("audio");
  await expect(homeAudio).toHaveAttribute('src', project.song.src);
  expect(await homeAudio.evaluate(element => element.paused)).toBe(true);
  await page.getByTestId('homepage-music').click();
  await expect.poll(() => homeAudio.evaluate(element => !element.paused && element.currentTime > .1)).toBe(true);
  await expect(page.getByTestId('homepage-music')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('homepage-music').click();
  await expect.poll(() => homeAudio.evaluate(element => element.paused)).toBe(true);
  await expect(page.getByTestId('homepage-music')).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId("start").click();
  await expect(page.locator('.wordmark .lucide-star')).toHaveCount(1);
  await expect(homeAudio).toHaveAttribute('src', memories[0].song.src);
  const card = page.getByTestId("memory-card");
  const audio = page.getByTestId("audio");
  await expect(card).toHaveAttribute("data-month", "2025-11");
  await expect.poll(() => audio.evaluate((element) => !element.paused && element.currentTime > .1)).toBe(true);
  await screenshot(page, "desktop-november.png");
  const playedSources = new Set();

  for (const memory of memories) {
    await page.locator(`.month-timeline button[data-month="${memory.id}"]`).click();
    await expect(card).toHaveAttribute("data-month", memory.id);
    await expect(audio).toHaveAttribute("src", memory.song.src);
    await expect.poll(() => audio.evaluate((element) => !element.paused && element.currentTime > .1)).toBe(true);
    await expect.poll(() => audio.evaluate((element) => element.duration)).toBeGreaterThan(5);
    playedSources.add(await audio.getAttribute("src"));
    await expect(page.locator('.month-button.active')).toHaveCount(1);
    await expect(page.locator('.month-button.active')).toHaveAttribute('data-month', memory.id);
    await expect(page.locator('.month-button.active')).toHaveAttribute('aria-current', 'step');
    await waitPhotos(page);
    await fullWindowSlide(page, `desktop ${memory.id}`);
    if (memory.quiz) {
      const wrongAnswer = (memory.quiz.answer + 1) % memory.quiz.options.length;
      await page.getByTestId(`option-${wrongAnswer}`).click();
      await expect(page.locator(".quiz-reveal")).toBeVisible();
      await expect(page.locator(".quiz-option.is-correct")).toHaveCount(1);
      await expect(page.locator(".quiz-option.is-wrong")).toHaveCount(1);
      await expect(page.locator(".quiz-option:disabled")).toHaveCount(memory.quiz.options.length);
      if (memory.id === "2026-01") await screenshot(page, "desktop-quiz.png");
    }
    if (memory.interaction) {
      await page.getByTestId("collect-moment").click();
      await expect(page.locator(".moment-reveal")).toBeVisible();
      await expect(page.getByTestId("collect-moment")).toHaveAttribute("aria-pressed", "true");
    }
    if (memory.concert?.number === 1) await screenshot(page, "desktop-concert.png");
    if (memory.letter) {
      await page.getByTestId("open-letter").click();
      await expect(page.locator(".letter-content")).toBeVisible();
      await screenshot(page, "desktop-birthday.png");
    }
  }
  expect(playedSources.size).toBe(13);

  await page.locator('.month-timeline button[data-month="2026-01"]').click();
  await expect(page.locator(".quiz-reveal")).toBeVisible();
  await page.locator('.month-timeline button[data-month="2026-11"]').click();
  await expect(page.locator(".letter-content")).toBeVisible();
  await page.getByRole("button", { name: "再播放一次我們的故事" }).click();
  await expect(card).toHaveAttribute("data-month", "2025-11");
  await page.locator('.month-timeline button[data-month="2026-01"]').click();
  await expect(page.locator(".quiz-reveal")).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await expect(card).toHaveAttribute("data-month", "2025-12");

  await page.keyboard.press("PageDown");
  await expect(card).toHaveAttribute("data-month", "2026-01");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(baseURL);
  await mobile.evaluate(() => document.fonts.ready);
  await screenshot(mobile, "mobile-cover.png");
  await mobile.getByTestId("start").click();
  for (const month of expectedMonths) {
    await mobile.locator(`.month-timeline button[data-month="${month}"]`).click();
    await expect(mobile.getByTestId("memory-card")).toHaveAttribute("data-month", month);
    await fullWindowSlide(mobile, `mobile ${month}`);
  }
  await mobile.locator('.month-timeline button[data-month="2026-05"]').click();
  await expect(mobile.getByTestId("memory-card")).toHaveAttribute("data-month", "2026-05");
  await mobile.getByTestId("option-0").click();
  await expect(mobile.locator(".quiz-reveal")).toBeVisible();
  await screenshot(mobile, "mobile-quiz.png");
  await mobile.locator(".slide-viewport").evaluate((element) => {
    const start = new Touch({ identifier: 1, target: element, clientX: 310, clientY: 260 });
    const end = new Touch({ identifier: 1, target: element, clientX: 100, clientY: 265 });
    element.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [start], changedTouches: [start] }));
    element.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [end] }));
  });
  await expect(mobile.getByTestId("memory-card")).toHaveAttribute("data-month", "2026-06");
  await mobile.locator('.month-timeline button[data-month="2026-11"]').click();
  await expect(mobile.getByTestId("memory-card")).toHaveAttribute("data-month", "2026-11");
  await mobile.getByTestId("open-letter").click();
  await screenshot(mobile, "mobile-birthday.png");

  for (const { width, height } of [{ width: 320, height: 740 }, { width: 768, height: 840 }, { width: 1280, height: 600 }, { width: 844, height: 390 }]) {
    await mobile.setViewportSize({ width, height });
    await mobile.getByRole("button", { name: "回到 NOV.17 封面" }).click();
    await expect(mobile.getByTestId("start")).toBeVisible();
    await expect(mobile.getByTestId('audio')).toHaveAttribute('src', project.song.src);
    await expect.poll(() => mobile.getByTestId('audio').evaluate(element => element.paused)).toBe(true);
    await fullWindowSlide(mobile, `${width}px cover`);
    expect(await mobile.locator(".homepage-title").evaluate((element) => element.scrollWidth <= element.clientWidth), `${width}px title fits`).toBe(true);
    await mobile.getByTestId("start").click();
    for (const month of expectedMonths) {
      await mobile.locator(`.month-timeline button[data-month="${month}"]`).click();
      await expect(mobile.getByTestId("memory-card")).toHaveAttribute("data-month", month);
      await fullWindowSlide(mobile, `${width}px ${month}`);
      await expect(mobile.locator('.month-button.active')).toHaveAttribute('data-month', month);
      await expect(mobile.locator('.month-button.active')).toBeInViewport();
    }
  }
  expect(errors, "Browser runtime errors").toEqual([]);
  writeFileSync(new URL("browser-validation.json", qa), JSON.stringify({ ok: true, months: 13, distinctSongs: playedSources.size, viewports: [[1440, 1080], [390, 844], [320, 740], [768, 840], [1280, 600], [844, 390]], errors }, null, 2));
  console.log("PASS: 13 months; 13 changing songs; photo loading; quiz answers and reset; moment animation; birthday letter; replay; keyboard/swipe; full-window slides; in-slide month highlighting; centered birthday homepage; transparent portrait and separate intro music; star wordmark on month slides; removed player and menus; portrait/landscape layouts.");
} finally {
  await browser.close();
}
