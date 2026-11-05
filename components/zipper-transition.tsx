"use client";

import { useEffect, useRef } from "react";

export const ZIPPER_TRANSITION_DURATION_MS = 4600;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
type Point = readonly [number, number];
const leftRail: Point[] = [[555, 92], [473, 144], [367, 194], [263, 246], [185, 294], [138, 346], [114, 405], [122, 451], [104, 507], [85, 568], [62, 631], [46, 695], [37, 751], [52, 796], [45, 843], [25, 888]];
const rightRail: Point[] = [[565, 90], [558, 150], [550, 227], [532, 322], [530, 420], [508, 526], [485, 623], [443, 700], [381, 753], [303, 793], [215, 826], [136, 851], [74, 883]];

function traceRail(path: Path2D, points: Point[], move = true) {
  if (move) path.moveTo(...points[0]);
  else path.lineTo(...points[0]);
  for (let index = 0; index < points.length - 1; index++) {
    const previous = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const after = points[Math.min(points.length - 1, index + 2)];
    path.bezierCurveTo(current[0] + (next[0] - previous[0]) / 6, current[1] + (next[1] - previous[1]) / 6, next[0] - (after[0] - current[0]) / 6, next[1] - (after[1] - current[1]) / 6, ...next);
  }
}

export default function ZipperTransition({ ready, onCovered, onComplete }: { ready: boolean; onCovered: () => void; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(ready);
  useEffect(() => { readyRef.current = ready; }, [ready]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const portrait = new Image();
    const closedTexture = document.createElement("canvas");
    closedTexture.width = 56; closedTexture.height = 909;
    const closedContext = closedTexture.getContext("2d");
    let imageReady = false;
    let reference: CanvasPattern | null = null;
    const loaded = () => {
      imageReady = true;
      if (portrait.naturalWidth > 0) {
        reference = context.createPattern(portrait, "no-repeat");
        if (closedContext) for (const [side, rail] of [leftRail, rightRail].entries()) {
          let segment = 1;
          for (let y = 100; y < 880; y += 2) {
            while (segment < rail.length - 1 && rail[segment][1] < y) segment++;
            const previous = rail[segment - 1];
            const next = rail[segment];
            const x = previous[0] + (next[0] - previous[0]) * (y - previous[1]) / (next[1] - previous[1]);
            closedContext.drawImage(portrait, x - 14, y, 28, 2, side * 28, y, 28, 2);
          }
        }
      }
    };
    portrait.onload = portrait.onerror = loaded;
    portrait.src = "/homepage/photos/bucc.jpg";
    if (portrait.complete) loaded();
    const portraitMask = new Path2D("M255 250 C300 213 421 208 480 300 L500 355 L470 440 C470 560 437 649 357 705 L277 761 L208 767 L173 797 L88 768 L95 667 L90 585 L119 535 L157 518 L171 451 L201 394 L202 311 Z");
    const left = new Path2D(); traceRail(left, leftRail);
    const right = new Path2D(); traceRail(right, rightRail);
    const opening = new Path2D();
    traceRail(opening, leftRail);
    traceRail(opening, [...rightRail].reverse(), false);
    opening.closePath();
    const puller = new Path2D("M582 10 L652 0 L672 47 L608 102 L588 166 L626 169 C673 169 684 222 671 268 C661 307 623 335 586 319 L554 300 L543 252 L558 193 L543 160 L522 135 L512 93 Z");
    let frame = 0;
    let started: number | null = null;
    let elapsed = 0;
    let width = 0;
    let height = 0;
    let density = 1;

    const draw = (time: number) => {
      const unzip = ease((time - 400) / 1100);
      const enter = ease((time - 1500) / 450);
      const leave = 1 - ease((time - 2500) / 450);
      const approach = ease((time - 2950) / 1650);
      const zoom = Math.exp(Math.log(18) * approach);
      const spread = .055 + .945 * unzip;
      const shear = -.48 * (1 - spread);
      const sourceScale = Math.min(height * .8 / 1000, width * .6 / 680);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#f5f3eb";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "#20221e0c";
      context.lineWidth = 1;
      for (let y = 130; y < height; y += 160) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(width, y + 35); context.stroke();
      }
      context.translate(width / 2, height / 2);
      context.scale(zoom * sourceScale, zoom * sourceScale);
      context.translate(-340, -455);
      if (unzip > 0) {
        context.save();
        context.transform(spread, 0, shear, 1, 340 * (1 - spread) - shear * 455, 0);
        context.globalCompositeOperation = "destination-out";
        context.fill(opening);
        context.restore();
      }

      if (enter * leave > 0 && portrait.naturalWidth > 0) {
        context.save();
        context.clip(opening);
        const look = Math.sin(clamp((time - 1950) / 550) * Math.PI * 2) * 8;
        context.translate((1 - enter * leave) * 150 + look, (1 - enter) * 24);
        context.clip(portraitMask);
        context.globalAlpha = enter * leave;
        context.drawImage(portrait, 0, 0, 680, 909);
        context.restore();
      }

      if (reference) {
        // Sample the original artwork through rail masks instead of redrawing its teeth.
        context.save();
        context.transform(spread, 0, shear, 1, 340 * (1 - spread) - shear * 455, 0);
        context.strokeStyle = reference;
        context.lineCap = context.lineJoin = "round";
        context.lineWidth = 56;
        context.stroke(left); context.stroke(right);
        context.restore();

        if (unzip < .25 && closedContext) {
          context.save();
          context.transform(1, 0, -.48, 1, 340 + .48 * 455 - 28, 0);
          context.globalAlpha = 1 - ease(unzip / .25);
          context.drawImage(closedTexture, 0, 0);
          context.restore();
        }

        const sourceX = 75 + (561 - 75) * unzip;
        const sourceY = 850 + (100 - 850) * unzip;
        const pullerX = 340 + spread * (sourceX - 340) + shear * (sourceY - 455);
        context.save();
        context.translate(pullerX - 561, sourceY - 100);
        context.fillStyle = reference;
        context.fill(puller);
        context.restore();
      }
      canvas.dataset.phase = time < 400 ? "closed" : time < 1500 ? "unzipping" : time < 2500 ? "peeking" : time < 2950 ? "retreating" : "approaching";
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * density); canvas.height = Math.ceil(height * density);
      draw(elapsed);
    };
    const tick = (now: number) => {
      if (readyRef.current && imageReady) {
        started ??= now;
        elapsed = Math.min(ZIPPER_TRANSITION_DURATION_MS, now - started);
        draw(elapsed);
        if (elapsed >= ZIPPER_TRANSITION_DURATION_MS) { onComplete(); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    onCovered();
    frame = requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      portrait.onload = portrait.onerror = null;
      closedTexture.width = closedTexture.height = 0;
    };
  }, [onCovered, onComplete]);

  return <div className="zipper-transition" aria-hidden="true" data-testid="zipper-transition"><canvas ref={canvasRef} /></div>;
}
