import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { loadMemoryData } from './load-memory-data.mjs';

const { events, project } = loadMemoryData();
const baseURL = process.env.NOV17_TEST_URL || 'http://127.0.0.1:3000';
const viewport = { width: 1440, height: 1080 };
const url = route => new URL(route, baseURL).href;
const qa = new URL('../.qa/', import.meta.url);
mkdirSync(qa, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], hydrationChecks = [], durations = {};
const blank = id => id === 'memo-5' || id === 'memo-7';
const observe = page => {
  expect(page.viewportSize()).toEqual(viewport);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|server rendered|did(?:n't| not) match|Minified React error #(?:418|423|425)/i.test(message.text())) errors.push(message.text());
  });
};
const initialRender = page => page.evaluate(() => ({
  shell: document.querySelector('.site-shell').className,
  screen: document.querySelector('.slide-page').getAttribute('data-testid'),
  event: document.querySelector('.slide-page').getAttribute('data-event'),
  source: document.querySelector('audio').getAttribute('src'),
  player: Boolean(document.querySelector('[data-testid="event-player"]')),
  months: document.querySelectorAll('.month-timeline, .month-button').length,
}));
const waitEvent = async (page, id) => {
  await expect(page).toHaveURL(url(`/${id}`));
  await expect(page.getByTestId('event-page')).toHaveAttribute('data-event', id);
  await expect(page.getByTestId('zipper-transition')).toHaveCount(0, { timeout: 12000 });
  await expect(page.getByTestId('audio')).toHaveAttribute('src', events.find(event => event.id === id).song.src);
};
const setRange = async (locator, value) => locator.evaluate((input, next) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(next));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, value);
const humanTime = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds)) % 60).padStart(2, '0')}`;

try {
  expect(events.map(event => event.id)).toEqual([...Array.from({ length: 9 }, (_, i) => `memo-${i + 1}`), 'memo-99']);
  for (const event of events) {
    expect(Array.isArray(event.lines) && event.lines.every(line => typeof line === 'string')).toBe(true);
    expect(existsSync(new URL(`../public${event.cover.src}`, import.meta.url))).toBe(true);
    expect(existsSync(new URL(`../public${event.song.src}`, import.meta.url))).toBe(true);
    for (const photo of event.photos ?? []) expect(existsSync(new URL(`../public/${photo.src.replace(/^\//, '')}`, import.meta.url))).toBe(true);
  }
  const routes = ['/home', '/prelude', '/intro', '/stats', ...events.map(event => `/${event.id}`)];
  const serverContext = await browser.newContext({ viewport, javaScriptEnabled: false });
  const server = await serverContext.newPage();
  for (const route of routes) {
    expect((await server.goto(url(route))).status()).toBe(200);
    const snapshot = await initialRender(server);
    expect(snapshot.months).toBe(0);
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport, reducedMotion });
      observe(page);
      await page.goto(url(route), { waitUntil: 'networkidle' });
      expect(await initialRender(page)).toEqual(snapshot);
      if (route.startsWith('/memo-') && !blank(route.slice(1))) {
        if (await page.getByTestId('audio').evaluate(audio => audio.paused)) await page.getByTestId('event-play-toggle').click();
        await expect.poll(() => page.getByTestId('audio').evaluate(audio => !audio.paused)).toBe(true);
      }
      hydrationChecks.push({ route, reducedMotion, matched: true });
      await page.close();
    }
  }
  await serverContext.close();

  const page = await browser.newPage({ viewport });
  observe(page);
  await page.addInitScript(() => {
    window.__entrances = [];
    document.addEventListener('animationend', event => {
      if (event.animationName !== 'intro-pop-in' || !(event.target instanceof HTMLElement)) return;
      const target = event.target;
      if (!target.matches('.event-line,.stats-line,.stats-continue')) return;
      window.__entrances.push({ kind: target.className, event: target.closest('[data-event]')?.getAttribute('data-event'), index: [...target.parentElement.children].indexOf(target) });
    });
  });
  await page.goto(url('/'));
  await expect(page).toHaveURL(url('/home'));
  await expect(page.locator('.homepage-title')).toHaveText(project.name);
  const homeBackground = await page.locator('main').evaluate(element => getComputedStyle(element).backgroundColor);
  const audio = page.getByTestId('audio');
  const node = await audio.elementHandle();
  await page.getByTestId('homepage-music').click();
  await expect(page).toHaveURL(url('/home'));
  await expect.poll(() => audio.evaluate(element => !element.paused && element.currentTime > .1)).toBe(true);
  const landingTime = await audio.evaluate(element => {
    element.dataset.loads = '0';
    element.addEventListener('loadstart', () => { element.dataset.loads = String(Number(element.dataset.loads) + 1); });
    return element.currentTime;
  });
  await page.getByTestId('homepage-music').click();
  await expect(page).toHaveURL(url('/prelude'));
  await expect(page.locator('.intro-line')).toHaveText(project.prelude.lines);
  await page.getByTestId('prelude-continue').click();
  await expect(page).toHaveURL(url('/intro'));
  await expect(page.locator('.intro-line')).toHaveText(project.intro.lines);
  await expect(page.getByRole('img', { name: '2025–2026' })).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page).toHaveURL(url('/stats'));
  await expect(page.getByTestId('stats-transition')).toHaveCount(0);
  await expect(page.getByTestId('stats-continue')).toHaveCSS('opacity', '1');
  const clock = await page.evaluate(since => ({ expected: Math.floor((Date.now() - Date.parse(since)) / 1000), actual: Number(document.querySelector('[data-testid="stats-seconds"]').textContent.replace(/[,\s]/g, '')) }), project.stats.since);
  expect(Math.abs(clock.actual - clock.expected)).toBeLessThanOrEqual(1);
  expect(await audio.evaluate(element => Number(element.dataset.loads))).toBe(0);
  expect(await audio.evaluate(element => element.currentTime)).toBeGreaterThan(landingTime);
  expect(await node.evaluate(element => element === document.querySelector('audio'))).toBe(true);
  await page.evaluate(() => {
    window.__statsTransitionCheck = { started: false, frames: 0, exposedFrames: 0 };
    const sample = () => {
      const stats = document.querySelector('.stats-page');
      const overlay = document.querySelector('[data-testid="stats-transition"]');
      const check = window.__statsTransitionCheck;
      if (overlay) check.started = true;
      if (stats && check.started) {
        check.frames++;
        if (!overlay || Number(getComputedStyle(overlay).opacity) < .999) check.exposedFrames++;
      }
      if (stats || !check.started) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.getByTestId('stats-continue').click();
  await expect(page.getByTestId('stats-transition')).toBeVisible();
  await expect(page).toHaveURL(url('/stats'));
  await expect(audio).toHaveAttribute('src', project.song.src);
  await waitEvent(page, 'memo-1');
  const transitionCheck = await page.evaluate(() => window.__statsTransitionCheck);
  expect(transitionCheck.frames).toBeGreaterThan(0);
  expect(transitionCheck.exposedFrames).toBe(0);
  expect(await node.evaluate(element => element === document.querySelector('audio'))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__entrances.filter(event => event.kind === 'event-line' && event.event === 'memo-1').length), { timeout: Math.max(12000, events[0].lines.length * 800 + 2000) }).toBe(events[0].lines.length);
  expect(await page.evaluate(() => window.__entrances.filter(event => event.kind === 'event-line' && event.event === 'memo-1').map(event => event.index))).toEqual(events[0].lines.map((_, index) => index));
  await expect(page.locator('.event-line')).toHaveText(events[0].lines);
  for (const line of await page.locator('.event-line').all()) await expect(line).toHaveCSS('opacity', '1');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL('desktop-event-memo-1.png', qa).pathname });
  await page.getByTestId('event-play-toggle').click();
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(true);
  const pausedTime = await audio.evaluate(element => element.currentTime);
  await page.waitForTimeout(400);
  expect(await audio.evaluate(element => element.currentTime)).toBeCloseTo(pausedTime, 1);
  const duration = await audio.evaluate(element => element.duration);
  await setRange(page.getByRole('slider', { name: '播放進度' }), duration * .3);
  await expect.poll(() => audio.evaluate(element => element.currentTime)).toBeCloseTo(duration * .3, 0);
  const seekedTime = await audio.evaluate(element => element.currentTime);
  await expect(page.getByTestId('elapsed-time')).toHaveText(humanTime(seekedTime));
  await expect(page.getByTestId('remaining-time')).toHaveText(`-${humanTime(duration - seekedTime)}`);
  await setRange(page.getByRole('slider', { name: '網站音量' }), .62);
  await expect.poll(() => audio.evaluate(element => element.volume)).toBeCloseTo(.62);
  await expect(page.getByRole('slider', { name: '網站音量' })).toHaveAttribute('aria-valuetext', '62%');
  await page.getByRole('slider', { name: '網站音量' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(url('/memo-1'));
  await expect.poll(() => audio.evaluate(element => element.volume)).toBeCloseTo(.63);
  await page.getByRole('button', { name: '靜音音樂', exact: true }).click();
  await expect.poll(() => audio.evaluate(element => element.muted)).toBe(true);
  await page.getByRole('button', { name: '取消靜音', exact: true }).click();
  await expect.poll(() => audio.evaluate(element => element.muted)).toBe(false);
  await page.getByTestId('event-play-toggle').click();
  await expect.poll(() => audio.evaluate(element => !element.paused)).toBe(true);
  expect(await page.evaluate(() => window.__entrances.filter(event => event.kind === 'event-line' && event.event === 'memo-1').length)).toBe(events[0].lines.length);
  await page.getByRole('button', { name: '下一個事件', exact: true }).click();
  await waitEvent(page, 'memo-2');
  await expect.poll(() => audio.evaluate(element => element.volume)).toBeCloseTo(.63);
  expect(await audio.evaluate(element => element.currentTime)).toBeLessThan(2);
  await page.goBack();
  await waitEvent(page, 'memo-1');
  await expect.poll(() => audio.evaluate(element => element.volume)).toBeCloseTo(.63);

  const sequence = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  observe(sequence);
  await sequence.goto(url('/memo-1'));
  if (await sequence.getByTestId('audio').evaluate(audio => audio.paused)) await sequence.getByTestId('event-play-toggle').click();
  for (const [index, event] of events.entries()) {
    await waitEvent(sequence, event.id);
    await expect.poll(() => sequence.getByTestId('audio').evaluate(audio => Number.isFinite(audio.duration) && audio.duration > 0)).toBe(true);
    durations[event.id] = await sequence.getByTestId('audio').evaluate(audio => audio.duration);
    expect(await sequence.locator('main').evaluate(element => getComputedStyle(element).backgroundColor)).toBe(homeBackground);
    await expect(sequence.locator('.month-timeline,.month-button,.memory-grid')).toHaveCount(0);
    await expect(sequence.getByTestId('dev-audio-mute')).toHaveCount(0);
    if (blank(event.id)) {
      await expect(sequence.getByTestId('event-player')).toHaveCount(0);
      expect(await sequence.locator('body').innerText()).toBe('');
      if (event.id === 'memo-5') await sequence.screenshot({ path: new URL('desktop-event-blank.png', qa).pathname });
    } else {
      await expect(sequence.getByTestId('event-cover')).toHaveAttribute('src', event.cover.src);
      await expect.poll(() => sequence.getByTestId('event-cover').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(sequence.locator('.event-track-title')).toHaveText(event.song.title);
      await expect(sequence.locator('.event-track-artist')).toHaveText(event.song.artist);
      await expect(sequence.locator('.event-line')).toHaveText(event.lines);
      const photos = event.photos ?? [];
      await expect(sequence.locator('.event-snapshot img')).toHaveCount(photos.length);
      for (const [photoIndex, photo] of photos.entries()) {
        const image = sequence.locator('.event-snapshot img').nth(photoIndex);
        await expect(image).toHaveAttribute('src', photo.src);
        await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
        await expect(image).toHaveCSS('object-fit', 'contain');
      }
      await expect(sequence.locator('.event-ambient')).toHaveCount(event.id === 'memo-1' ? 1 : 0);
      await expect(sequence.getByRole('slider', { name: '播放進度' })).toHaveAttribute('max', String(durations[event.id]));
      expect(await sequence.getByTestId('audio').evaluate(audio => audio.currentTime)).toBeLessThan(2);
    }
    if (index < events.length - 1) await sequence.getByRole('button', { name: '下一個事件', exact: true }).click();
  }
  await sequence.getByRole('button', { name: '從第一個事件重新播放' }).click();
  await waitEvent(sequence, 'memo-1');
  await sequence.getByRole('button', { name: '下一個事件', exact: true }).click();
  await waitEvent(sequence, 'memo-2');
  await sequence.goBack();
  await waitEvent(sequence, 'memo-1');
  expect(await sequence.getByTestId('audio').evaluate(audio => audio.currentTime)).toBeLessThan(2);
  await sequence.keyboard.press('PageDown');
  await waitEvent(sequence, 'memo-2');
  await sequence.keyboard.press('PageUp');
  await waitEvent(sequence, 'memo-1');
  await sequence.getByRole('button', { name: '返回統計頁' }).click();
  await expect(sequence).toHaveURL(url('/stats'));
  await expect(sequence.getByTestId('stats-transition')).toHaveCount(0);
  await sequence.goto(url('/memo'));
  await waitEvent(sequence, 'memo-1');
  await sequence.reload();
  await waitEvent(sequence, 'memo-1');
  expect((await sequence.goto(url('/memo-11'))).status()).toBe(404);
  expect(await sequence.getByTestId('event-player').count()).toBe(0);
  await sequence.close();

  const failed = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  observe(failed);
  await failed.route(url(events[1].song.src), route => route.fulfill({ status: 404, body: 'missing audio' }));
  await failed.goto(url('/memo-2'));
  await expect(failed.locator('.event-audio-error')).toBeVisible();
  await expect(failed.getByRole('slider', { name: '播放進度' })).toBeDisabled();
  await expect(failed.getByTestId('elapsed-time')).toHaveText('0:00');
  await failed.getByRole('button', { name: '下一個事件', exact: true }).click();
  await waitEvent(failed, 'memo-3');
  await expect.poll(() => failed.getByTestId('audio').evaluate(audio => audio.duration > 0 && !audio.paused)).toBe(true);
  await expect(failed.locator('.event-audio-error')).toHaveCount(0);
  await failed.close();

  const cancel = await browser.newPage({ viewport });
  observe(cancel);
  await cancel.goto(url('/stats'));
  await cancel.getByTestId('stats-continue').click();
  await expect(cancel.getByTestId('stats-transition')).toBeVisible();
  await cancel.getByTestId('page-back').click();
  await expect(cancel).toHaveURL(url('/intro'));
  await cancel.waitForTimeout(3500);
  await expect(cancel).toHaveURL(url('/intro'));
  await cancel.close();
  expect(errors).toEqual([]);
  const result = { ok: true, checkedAt: new Date().toISOString(), viewport, routes, hydrationChecks, events: events.length, blankEvents: ['memo-5','memo-7'], durations, nativeAudioProgress: true, seekAndPlayback: true, websiteVolume: true, systemVolumeAccess: false, perEventReset: true, sequentialLines: true, statsTransition: true, legacyMemoRedirect: true, missingAudioRecovery: true, errors };
  writeFileSync(new URL('browser-validation.json', qa), JSON.stringify(result, null, 2));
  console.log('PASS: 1440x1080; landing flow and shared audio; 10 event routes; blank 5/7; actual durations/progress; play/pause/seek/volume; sequential text; reset on navigation; history/redirect; missing audio recovery; no hydration errors.');
} finally { await browser.close(); }
