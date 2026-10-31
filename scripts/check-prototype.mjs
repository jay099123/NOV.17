import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadMemoryData } from "./load-memory-data.mjs";

const { memories, project } = loadMemoryData();
const baseURL = process.env.NOV17_TEST_URL || "http://127.0.0.1:3000";
// Project preference: browser checks only use this desktop viewport.
const viewport = { width: 1440, height: 1080 };
const homeURL = new URL("/home", baseURL).href;
const introURL = new URL("/intro", baseURL).href;
const memoURL = new URL("/memo", baseURL).href;
const qa = new URL("../.qa/", import.meta.url);
mkdirSync(qa, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const hydrationChecks = [];
const observeErrors = (page) => {
  expect(page.viewportSize(), 'Desktop-only browser test policy').toEqual(viewport);
  page.on('pageerror', error => errors.push(error.message));
  // React also reports recoverable hydration mismatches through console.error.
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|server rendered|did(?:n't| not) match|Minified React error #(?:418|423|425)/i.test(message.text())) {
      errors.push(message.text());
    }
  });
};
const initialRender = page => page.evaluate(() => ({
  className: document.querySelector('.site-shell').className,
  monthBars: document.querySelectorAll('.slide-navigation').length,
  month: document.querySelector('[data-testid="memory-card"]')?.getAttribute('data-month') || null,
  cover: Boolean(document.querySelector('[data-testid="cover"]')),
  intro: Boolean(document.querySelector('[data-testid="intro"]')),
  song: document.querySelector('audio').getAttribute('src'),
}));
const expectedMonths = Array.from({ length: 13 }, (_, i) => {
  const date = new Date(Date.UTC(2025, 10 + i, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
});
const fullWindowSlide = async (page, label) => {
  await expect(page.locator('.slide-page')).toHaveCSS('opacity', '1');
  const geometry = await page.evaluate(() => {
    const stage = document.querySelector('.story-stage').getBoundingClientRect();
    const navigation = document.querySelector('.slide-navigation')?.getBoundingClientRect();
    const homeTitle = document.querySelector('.homepage-title');
    const introTitle = document.querySelector('.intro-title');
    const brand = (document.querySelector('.wordmark') || homeTitle || introTitle).getBoundingClientRect();
    return { isHome: Boolean(homeTitle), isIntro: Boolean(introTitle), width: innerWidth, height: innerHeight, stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height }, navigation: navigation ? { top: navigation.top, bottom: navigation.bottom, left: navigation.left, right: navigation.right } : null, brand: { top: brand.top, left: brand.left, right: brand.right, bottom: brand.bottom }, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight };
  });
  expect(geometry.stage.x, `${label}: left edge`).toBeCloseTo(0, 0);
  expect(geometry.stage.y, `${label}: top edge`).toBeCloseTo(0, 0);
  expect(geometry.stage.width, `${label}: slide width`).toBeCloseTo(geometry.width, 0);
  expect(geometry.stage.height, `${label}: slide height`).toBeCloseTo(geometry.height, 0);
  if (geometry.isHome || geometry.isIntro) expect(geometry.navigation, `${label}: no landing-page month bar`).toBeNull();
  else {
    expect(geometry.navigation.top, `${label}: navigation at bottom`).toBeGreaterThan(geometry.height - 150);
    expect(geometry.navigation.bottom).toBeLessThanOrEqual(geometry.height);
    expect(geometry.navigation.left).toBeGreaterThanOrEqual(0);
    expect(geometry.navigation.right).toBeLessThanOrEqual(geometry.width);
  }
  expect(geometry.brand.top).toBeGreaterThanOrEqual(0);
  expect(geometry.brand.left).toBeGreaterThanOrEqual(0);
  expect(geometry.brand.right).toBeLessThanOrEqual(geometry.width);
  if (geometry.isHome || geometry.isIntro) expect((geometry.brand.left + geometry.brand.right) / 2).toBeCloseTo(geometry.width / 2, 0);
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
const enterIntroFromHome = async (page) => {
  await page.getByTestId('homepage-music').click();
  await expect(page).toHaveURL(homeURL);
  await expect.poll(() => page.getByTestId('audio').evaluate(audio => !audio.paused && audio.currentTime > .1)).toBe(true);
  await page.getByTestId('homepage-music').click();
  await expect(page).toHaveURL(introURL);
};
const enterMemoFromHome = async (page) => {
  await enterIntroFromHome(page);
  await expect(page.getByTestId('intro')).toBeVisible();
  await expect(page.getByRole('img', { name: '2025–2026' })).toBeVisible();
  await expect(page.getByTestId('start')).toBeVisible();
  await fullWindowSlide(page, 'intro');
  await page.getByTestId('start').click();
  await expect(page).toHaveURL(memoURL);
};

try {
  const serverContext = await browser.newContext({ javaScriptEnabled: false, viewport });
  const serverPage = await serverContext.newPage();
  expect(serverPage.viewportSize()).toEqual(viewport);
  for (const [url, mode] of [[homeURL, 'home'], [introURL, 'intro'], [memoURL, 'memo']]) {
    const isHome = mode === 'home';
    const isMemo = mode === 'memo';
    const response = await serverPage.goto(url);
    expect(response.status(), `${url}: initial HTML`).toBe(200);
    const server = await initialRender(serverPage);
    expect(server.className).toContain(isHome ? 'is-homepage' : isMemo ? 'is-memo' : 'is-intro');
    expect(server.monthBars).toBe(isMemo ? 1 : 0);
    expect(server.cover).toBe(isHome);
    expect(server.intro).toBe(mode === 'intro');
    expect(server.month).toBe(isMemo ? memories[0].id : null);
    expect(server.song).toBe(isMemo ? memories[0].song.src : project.song.src);
    if (isHome) await expect(serverPage.getByTestId('start')).toHaveCount(0);
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const hydratedPage = await browser.newPage({ viewport, reducedMotion });
      observeErrors(hydratedPage);
      await hydratedPage.goto(url, { waitUntil: 'networkidle' });
      if (isHome) await expect(hydratedPage.getByTestId('start')).toHaveCount(0);
      expect(await initialRender(hydratedPage), `${url}: SSR matches hydrated state (${reducedMotion})`).toEqual(server);
      // The following event confirms hydration completed, without comparing after navigation.
      if (isHome) {
        await enterIntroFromHome(hydratedPage);
      } else if (isMemo) {
        await hydratedPage.locator('.month-button').first().click();
      } else {
        await hydratedPage.getByTestId('start').click();
        await expect(hydratedPage).toHaveURL(memoURL);
      }
      await expect.poll(() => hydratedPage.getByTestId('audio').evaluate(element => !element.paused)).toBe(true);
      hydrationChecks.push({ path: new URL(url).pathname, reducedMotion, matched: true });
      await hydratedPage.close();
    }
  }
  await serverContext.close();
  expect(memories.map((memory) => memory.id)).toEqual(expectedMonths);
  expect(new Set(memories.map((memory) => memory.song.src)).size).toBe(13);
  for (const photo of [project.photo, ...memories.flatMap(memory => memory.photos)]) {
    expect(photo).not.toHaveProperty('tile');
  }
  const page = await browser.newPage({ viewport });
  observeErrors(page);
  await page.goto(baseURL);
  await expect(page).toHaveURL(homeURL);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle(/NOV\.17/);
  await expect(page.getByTestId("start")).toHaveCount(0);
  await expect(page.locator('.homepage-actions, .homepage-music-hint')).toHaveCount(0);
  await expect(page.getByTestId('slide-navigation')).toHaveCount(0);
  await expect(page.locator('.month-timeline')).toHaveCount(0);
  await expect(page.locator('.wordmark')).toHaveCount(0);
  await expect(page.locator('.homepage-title')).toHaveText(project.name);
  await expect(page.locator('.homepage-greeting')).toHaveText(project.greeting);
  await expect(page.locator('.homepage-cutout')).toHaveAttribute('src', project.photo.src);
  await expect(page.locator('.music-player, .header-nav, .chapter-controls, .site-footer, .stage-ribbon, .info-modal, .track-title, audio[controls]')).toHaveCount(0);
  await fullWindowSlide(page, 'desktop cover');
  await screenshot(page, "desktop-cover.png");

  const homeAudio = page.getByTestId("audio");
  const audioNode = await homeAudio.elementHandle();
  await expect(homeAudio).toHaveAttribute('src', project.song.src);
  expect(await homeAudio.evaluate(element => element.paused)).toBe(true);
  await page.locator('.homepage-title').click();
  await expect(page).toHaveURL(homeURL);
  await expect.poll(() => homeAudio.evaluate(element => !element.paused && element.currentTime > .1)).toBe(true);
  await expect(page.getByTestId('homepage-music')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('intro')).toHaveCount(0);
  await page.locator('.homepage-title').click();
  await expect(page).toHaveURL(introURL);
  expect(await audioNode.evaluate(element => element === document.querySelector('audio')), 'shared audio survives intro navigation').toBe(true);
  await expect(homeAudio).toHaveAttribute('src', project.song.src);
  await expect(page.locator('.homepage-next')).toHaveCount(0);
  if (project.intro) await expect(page.locator('.intro-line')).toHaveText(project.intro.lines);
  await expect(page.getByRole('img', { name: '2025–2026' })).toBeVisible();
  await expect(page.getByTestId('start')).toBeVisible();
  await fullWindowSlide(page, 'desktop intro');
  await screenshot(page, 'desktop-intro.png');
  await expect(page.getByTestId('page-back')).toHaveAccessibleName('返回主頁');
  await page.getByTestId('page-back').click();
  await expect(page).toHaveURL(homeURL);
  await expect(page.getByTestId('homepage-music')).toBeVisible();
  await expect.poll(() => homeAudio.evaluate(element => element.paused)).toBe(true);
  await enterIntroFromHome(page);
  await page.getByTestId("start").click();
  await expect(page).toHaveURL(memoURL);
  expect(await audioNode.evaluate(element => element === document.querySelector('audio')), 'shared audio survives route navigation').toBe(true);
  await expect(page.locator('.story-stage > .slide-navigation .month-button')).toHaveCount(13);
  await expect(page.locator('.wordmark .lucide-star')).toHaveCount(1);
  await expect(homeAudio).toHaveAttribute('src', memories[0].song.src);
  const card = page.getByTestId("memory-card");
  const audio = page.getByTestId("audio");
  await expect(card).toHaveAttribute("data-month", "2025-11");
  await expect.poll(() => audio.evaluate((element) => !element.paused && element.currentTime > .1)).toBe(true);
  await expect(page.getByTestId('page-back')).toHaveAccessibleName('返回歡迎頁');
  await page.getByTestId('page-back').click();
  await expect(page).toHaveURL(introURL);
  await expect(page.getByTestId('intro')).toBeVisible();
  await expect(homeAudio).toHaveAttribute('src', project.song.src);
  expect(await audioNode.evaluate(element => element === document.querySelector('audio'))).toBe(true);
  await page.getByTestId('start').click();
  await expect(page).toHaveURL(memoURL);
  await expect(card).toHaveAttribute('data-month', memories[0].id);
  await screenshot(page, "desktop-november.png");
  const playedSources = new Set();

  for (const memory of memories) {
    await page.locator(`.month-timeline button[data-month="${memory.id}"]`).click();
    await expect(card).toHaveAttribute("data-month", memory.id);
    await expect(page.getByTestId('page-back')).toHaveCount(memory.id === memories[0].id ? 1 : 0);
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

  await page.getByRole('button', { name: '回到 NOV.17 封面' }).click();
  await expect(page).toHaveURL(homeURL);
  await expect(page.getByTestId('homepage-music')).toBeVisible();
  await expect(page.getByTestId('start')).toHaveCount(0);
  await expect(page.getByTestId('slide-navigation')).toHaveCount(0);
  await expect(homeAudio).toHaveAttribute('src', project.song.src);
  await expect.poll(() => homeAudio.evaluate(element => element.paused)).toBe(true);
  expect(await audioNode.evaluate(element => element === document.querySelector('audio'))).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(memoURL);
  await expect(card).toHaveAttribute('data-month', '2025-11');
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

  const direct = await browser.newPage({ viewport });
  observeErrors(direct);
  await direct.goto(memoURL);
  await expect(direct.getByTestId('memory-card')).toHaveAttribute('data-month', '2025-11');
  await expect(direct.locator('.month-button')).toHaveCount(13);
  await expect(direct.locator('.homepage-title')).toHaveCount(0);
  await direct.reload();
  await expect(direct.getByTestId('memory-card')).toHaveAttribute('data-month', '2025-11');
  await direct.locator('.month-button[data-month="2025-12"]').click();
  await expect.poll(() => direct.getByTestId('audio').evaluate(element => !element.paused && element.currentTime > .1)).toBe(true);
  await direct.getByRole('button', { name: '回到 NOV.17 封面' }).click();
  await expect(direct).toHaveURL(homeURL);
  await expect(direct.getByTestId('homepage-music')).toBeVisible();
  await expect(direct.getByTestId('start')).toHaveCount(0);
  await expect(direct.getByTestId('slide-navigation')).toHaveCount(0);
  await enterMemoFromHome(direct);
  await direct.getByRole('button', { name: '回到 NOV.17 封面' }).click();
  await expect(direct).toHaveURL(homeURL);
  await expect(direct.getByTestId('homepage-music')).toBeVisible();
  await expect(direct.getByTestId('start')).toHaveCount(0);
  await direct.close();

  expect(errors, "Browser runtime errors").toEqual([]);
  writeFileSync(new URL("browser-validation.json", qa), JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), desktopOnly: true, hydrationChecks, routes: ['/home', '/intro', '/memo'], rootRedirect: true, homepageMonthBar: false, homepageNextRemoved: true, homeTwoClicks: true, introYears: true, introPlayButton: true, pageBackNavigation: true, sharedAudio: true, browserHistory: true, directMemoReload: true, months: 13, distinctSongs: playedSources.size, viewports: [[viewport.width, viewport.height]], errors }, null, 2));
  console.log("PASS: desktop 1440x1080; first click plays music, second enters /intro; 2025–2026 footer; animated welcome and play button; /memo with shared audio and state; browser history; direct memo reload; 13 months and songs; photos; quiz/reset; collection; birthday letter; keyboard; full-window slides.");
} finally {
  await browser.close();
}
