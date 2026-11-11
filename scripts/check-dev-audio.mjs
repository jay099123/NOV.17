import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadMemoryData } from './load-memory-data.mjs';

const { events, eventSequence } = loadMemoryData();
const viewport = { width: 1440, height: 1080 };
const developmentURL = process.env.NOV17_DEV_TEST_URL || 'http://127.0.0.1:3000';
const productionURL = process.env.NOV17_TEST_URL;
const storageKey = 'nov17:dev-audio-muted';
const blank = id => id === 'memo-5';
const qa = new URL('../.qa/', import.meta.url);
mkdirSync(qa, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const observe = page => {
  expect(page.viewportSize()).toEqual(viewport);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|server rendered|did(?:n't| not) match|Minified React error #(?:418|423|425)/i.test(message.text())) errors.push(message.text());
  });
};

try {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  observe(page);
  await page.addInitScript(() => {
    window.__playStates = [];
    document.addEventListener('play', event => {
      if (event.target instanceof HTMLAudioElement) window.__playStates.push(event.target.muted);
    }, true);
  });
  await page.goto(new URL('/memo-1', developmentURL).href);
  const button = page.getByTestId('dev-audio-mute');
  const audio = page.getByTestId('audio');
  await expect(button).toBeVisible();
  if (await audio.evaluate(element => element.paused)) await page.getByTestId('event-play-toggle').click();
  await expect.poll(() => audio.evaluate(element => !element.paused && element.currentTime > .1)).toBe(true);
  const position = await audio.evaluate(element => element.currentTime);
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => audio.evaluate(element => element.muted && !element.paused && element.currentTime >= 0)).toBe(true);
  expect(await audio.evaluate(element => element.currentTime)).toBeGreaterThanOrEqual(position);
  for (const [index, event] of eventSequence.entries()) {
    await expect(page.getByTestId('event-page')).toHaveAttribute('data-event', event.id, { timeout: 12000 });
    await expect(audio).toHaveAttribute('src', event.song.src);
    await expect(button).toHaveCount(blank(event.id) ? 0 : 1);
    await expect.poll(() => audio.evaluate(element => element.muted && !element.paused)).toBe(true);
    if (event.quiz) {
      for (const question of event.quiz.questions) {
        await expect(page.getByTestId('event-quiz').getByRole('heading', { level: 2 })).toHaveText(question.prompt);
        await page.locator(`[data-option="${question.answer}"]`).click();
      }
    } else if (index < eventSequence.length - 1) await page.keyboard.press('ArrowRight');
  }
  await page.getByRole('button', { name: '從第一個事件重新播放' }).click();
  await expect(page.getByTestId('event-page')).toHaveAttribute('data-event', 'memo-1');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  if (await audio.evaluate(element => element.paused)) await page.getByTestId('event-play-toggle').click();
  await expect.poll(() => audio.evaluate(element => !element.paused)).toBe(true);
  expect(await page.evaluate(() => window.__playStates.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__playStates.every(Boolean))).toBe(true);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe('false');

  const blocked = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  observe(blocked);
  await blocked.addInitScript(key => {
    for (const method of ['getItem','setItem']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (requestedKey, ...args) {
        if (requestedKey === key) throw new DOMException('Storage unavailable', 'SecurityError');
        return original.call(this, requestedKey, ...args);
      };
    }
  }, storageKey);
  await blocked.goto(new URL('/memo-1', developmentURL).href);
  await blocked.getByTestId('dev-audio-mute').click();
  await expect(blocked.getByTestId('audio')).toHaveJSProperty('muted', true);
  await blocked.close();

  if (productionURL) {
    const production = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    observe(production);
    await production.addInitScript(key => localStorage.setItem(key, 'true'), storageKey);
    for (const route of ['/home','/prelude','/intro','/stats', ...events.map(event => `/${event.id}`)]) {
      await production.goto(new URL(route, productionURL).href);
      await expect(production.getByTestId('dev-audio-mute')).toHaveCount(0);
      expect(await production.getByTestId('audio').evaluate(element => element.muted)).toBe(false);
    }
    await production.close();
  }
  expect(errors).toEqual([]);
  writeFileSync(new URL('dev-audio-validation.json', qa), JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), viewport, events: events.length, blankPagesStayBlank: true, mutePreservesPlayback: true, acrossEventsAndReplay: true, restoredBeforePlayback: true, storageFallback: true, productionChecked: Boolean(productionURL), errors }, null, 2));
  console.log('PASS: event development mute; blank pages remain blank; playback/persistence/replay/keyboard/storage fallback; desktop 1440x1080.');
} finally { await browser.close(); }
