import { chromium, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { loadMemoryData } from './load-memory-data.mjs';

const { events } = loadMemoryData();
const quizEvent = events.find(event => event.id === 'memo-6.5');
const quiz = quizEvent.quiz;
const viewport = { width: 1440, height: 1080 };
const baseURL = process.env.NOV17_TEST_URL || 'http://127.0.0.1:3000';
const url = id => new URL(`/${id}`, baseURL).href;
const browser = await chromium.launch({ headless: true });
const errors = [];
const waitEvent = async (page, id) => {
  await expect(page).toHaveURL(url(id), { timeout: 12000 });
  await expect(page.getByTestId('event-page')).toHaveAttribute('data-event', id);
  await expect(page.getByTestId('audio')).toHaveAttribute('src', events.find(event => event.id === id).song.src);
};
const answer = async (page, question, choice) => {
  await expect(page.getByTestId('event-quiz').getByRole('heading', { level: 2 })).toHaveText(question.prompt);
  await page.locator(`[data-option="${choice}"]`).click();
};
const expectResult = async (page, correct, checkSound = false) => {
  const result = page.getByTestId('quiz-result');
  await expect(result).toHaveAttribute('data-phase', 'waiting');
  await expect(page).toHaveURL(url('memo-6.5'));
  await expect(page.getByTestId('audio')).toHaveJSProperty('paused', true);
  await expect(page.getByTestId('event-quiz').locator('[data-option]')).toHaveCount(0);
  const roll = page.getByTestId('quiz-drumroll');
  await expect(roll).toHaveAttribute('src', quiz.result.drumSrc);
  if (checkSound) {
    await expect.poll(() => roll.evaluate(audio => !audio.paused && audio.currentTime > 0)).toBe(true);
    expect(await roll.evaluate(audio => audio.muted)).toBe(await page.getByTestId('audio').evaluate(audio => audio.muted));
    expect(await roll.evaluate(audio => audio.volume)).toBeCloseTo(await page.getByTestId('audio').evaluate(audio => audio.volume));
  }
  await expect(result).toHaveAttribute('data-phase', 'revealed', { timeout: 6000 });
  await expect(page.getByTestId('quiz-result-title')).toHaveText(correct.every(Boolean) ? quiz.result.correctTitle : quiz.result.incorrectTitle);
  await expect(roll).toHaveJSProperty('paused', true);
  await expect(page).toHaveURL(url('memo-6.5'));
  const rows = page.locator('.quiz-result-answers li');
  await expect(rows).toHaveCount(correct.every(Boolean) ? 0 : correct.length);
  if (!correct.every(Boolean)) for (const [index, value] of correct.entries()) {
    await expect(rows.nth(index)).toHaveAttribute('data-correct', String(value));
    await expect(rows.nth(index).locator('strong')).toHaveText(value ? quiz.result.correctLabel : quiz.result.incorrectLabel);
  }
};

try {
  // Every correct/incorrect combination, with all three questions always answered.
  for (let pattern = 0; pattern < 2 ** quiz.questions.length; pattern++) {
    const page = await browser.newPage({ viewport, reducedMotion: pattern === 0 ? 'no-preference' : 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url('memo-6.5'));
    await expect(page.getByTestId('event-quiz').getByRole('heading', { level: 1 })).toHaveText(quiz.title);
    await expect(page.locator('.event-quiz-background')).toHaveAttribute('src', quizEvent.cover.src);
    await expect.poll(() => page.locator('.event-quiz-background').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const audio = await page.getByTestId('audio').elementHandle();
    if (pattern === 1) await audio.evaluate(node => { node.muted = true; node.volume = .23; });
    for (const [index, question] of quiz.questions.entries()) {
      await page.keyboard.press('PageDown');
      await page.keyboard.press('ArrowRight');
      await expect(page).toHaveURL(url('memo-6.5'));
      await expect(page.locator('.event-quiz-question')).toHaveCount(1);
      const wrong = question.options.find(option => option.id !== question.answer).id;
      await answer(page, question, pattern & (1 << index) ? wrong : question.answer);
    }
    const destination = pattern === 0 ? 'memo-7' : 'memo-67';
    await expectResult(page, quiz.questions.map((_, index) => !(pattern & (1 << index))), pattern < 2);
    await waitEvent(page, destination);
    await expect(page.getByTestId('event-quiz')).toHaveCount(0);
    await expect(page.getByTestId('event-player')).toHaveCount(1);
    await expect(page.getByTestId('event-cover')).toHaveAttribute('src', events.find(event => event.id === destination).cover.src);
    expect(await audio.evaluate(node => node === document.querySelector('audio'))).toBe(true);
    expect(await page.getByTestId('audio').evaluate(node => node.currentTime)).toBeLessThan(2);
    if (pattern < 2 && existsSync(new URL(`../public${events.find(event => event.id === destination).song.src}`, import.meta.url))) {
      await expect.poll(() => page.getByTestId('audio').evaluate(node => node.duration > 0)).toBe(true);
      if (await page.getByTestId('audio').evaluate(node => node.paused)) await page.getByTestId('event-play-toggle').click();
      await page.getByTestId('event-play-toggle').click();
      await expect(page.getByTestId('audio')).toHaveJSProperty('paused', true);
      await page.getByTestId('event-play-toggle').click();
      await expect(page.getByTestId('audio')).toHaveJSProperty('paused', false);
    } else if (pattern < 2) {
      await expect(page.locator('.event-audio-error')).toBeVisible();
      console.log(`NOTE: ${destination} background song is missing; verified result navigation and audio-error state.`);
    }
    await page.getByRole('button', { name: '下一個事件', exact: true }).click();
    await waitEvent(page, 'memo-8');
    if (pattern === 0) {
      await expect(page.locator('.event-snapshot img')).toHaveCount(4);
      for (const image of await page.locator('.event-snapshot img').all()) {
        await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
        await expect(image).toHaveCSS('object-fit', 'contain');
        const bounds = await image.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      }
    }
    await page.keyboard.press('PageUp');
    await waitEvent(page, destination);
    await page.keyboard.press('PageDown');
    await waitEvent(page, 'memo-8');
    if (pattern === 0) {
      // Browser Back to the quiz starts a fresh attempt instead of reusing answers.
      await page.goBack();
      await page.goBack();
      await page.goBack();
      await page.goBack();
      await waitEvent(page, 'memo-6.5');
      await expect(page.getByTestId('event-quiz').getByRole('heading', { level: 2 })).toHaveText(quiz.questions[0].prompt);
      for (const [index, question] of quiz.questions.entries()) {
        await answer(page, question, index === 0 ? question.options.find(option => option.id !== question.answer).id : question.answer);
      }
      await waitEvent(page, 'memo-67');
    }
    await page.close();
  }

  const page = await browser.newPage({ viewport });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url('memo-6'));
  await page.getByRole('button', { name: '下一個事件', exact: true }).click();
  await waitEvent(page, 'memo-6.5');
  const first = quiz.questions[0];
  await page.locator('[data-option]').last().evaluate(button => { button.click(); button.click(); });
  await expect(page.getByTestId('event-quiz').getByRole('heading', { level: 2 })).toHaveText(quiz.questions[1].prompt);
  await expect(page.locator('.event-quiz-progress')).toHaveText(quiz.progressLabel.replaceAll('{current}', '2').replaceAll('{total}', String(quiz.questions.length)));
  for (const question of quiz.questions.slice(1)) await answer(page, question, question.answer);
  await waitEvent(page, first.options.at(-1).id === first.answer ? 'memo-7' : 'memo-67');
  await page.reload();
  await page.getByRole('button', { name: '下一個事件', exact: true }).click();
  await waitEvent(page, 'memo-8');
  await page.close();

  const cancelResult = await browser.newPage({ viewport });
  cancelResult.on('pageerror', error => errors.push(error.message));
  await cancelResult.goto(url('memo-6'));
  await cancelResult.getByRole('button', { name: '下一個事件', exact: true }).click();
  for (const question of quiz.questions) await answer(cancelResult, question, question.answer);
  await expect(cancelResult.getByTestId('quiz-result')).toHaveAttribute('data-phase', 'waiting');
  const roll = await cancelResult.getByTestId('quiz-drumroll').elementHandle();
  await cancelResult.goBack();
  await waitEvent(cancelResult, 'memo-6');
  expect(await roll.evaluate(audio => audio.paused)).toBe(true);
  await cancelResult.waitForTimeout(5600);
  await expect(cancelResult).toHaveURL(url('memo-6'));
  await cancelResult.close();

  const cancel = await browser.newPage({ viewport });
  cancel.on('pageerror', error => errors.push(error.message));
  await cancel.goto(url('memo-6'));
  await cancel.getByRole('button', { name: '下一個事件', exact: true }).click();
  for (const question of quiz.questions) await answer(cancel, question, question.answer);
  await cancel.waitForTimeout(130);
  await cancel.goBack();
  await waitEvent(cancel, 'memo-6');
  await cancel.waitForTimeout(600);
  await expect(cancel).toHaveURL(url('memo-6'));
  await cancel.close();

  const missingAudio = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  missingAudio.on('pageerror', error => errors.push(error.message));
  await missingAudio.route(url(quizEvent.song.src.replace(/^\//, '')), route => route.fulfill({ status: 404, body: 'missing audio' }));
  await missingAudio.goto(url('memo-6.5'));
  await expect.poll(() => missingAudio.getByTestId('audio').evaluate(audio => Boolean(audio.error))).toBe(true);
  for (const question of quiz.questions) await answer(missingAudio, question, question.answer);
  await waitEvent(missingAudio, 'memo-7');
  await missingAudio.close();
  const missingRoll = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  missingRoll.on('pageerror', error => errors.push(error.message));
  await missingRoll.route(url(quiz.result.drumSrc.replace(/^\//, '')), route => route.fulfill({ status: 404, body: 'missing drumroll' }));
  await missingRoll.goto(url('memo-6.5'));
  for (const question of quiz.questions) await answer(missingRoll, question, question.answer);
  await expectResult(missingRoll, quiz.questions.map(() => true));
  await waitEvent(missingRoll, 'memo-7');
  await missingRoll.close();
  expect(errors).toEqual([]);
  console.log(`PASS: 1440x1080; ${2 ** quiz.questions.length} answer patterns; spotlight wait/result titles and per-question verdicts; drumroll playback/mute/volume/cleanup; both branches → memo-8; branch-aware previous; fresh retry; repeated clicks; direct branch reload; cancellation during final answer and result; missing music/drumroll; normal/reduced motion; no page errors.`);
} finally { await browser.close(); }
