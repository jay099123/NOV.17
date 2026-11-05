"use client";

import { useEffect, useRef, type CSSProperties } from "react";

export const GOLDEN_SPIRAL_DURATION_MS = 3200;

const phi = (1 + Math.sqrt(5)) / 2;
// A golden spiral grows by phi with each quarter turn.
const growth = Math.log(phi) / (Math.PI / 2);
const turns = Math.log(1600 / 3) / growth;
const colors = ["#c1afea", "#d2f65a", "#ff7049", "#f5f3eb", "#20221e"];
const star = "50,0 60,31 85,15 69,40 100,50 69,60 85,85 60,69 50,100 40,69 15,85 31,60 0,50 31,40 15,15 40,31";

function spiralEdge(phase: number, reverse = false) {
  const points = Array.from({ length: 73 }, (_, index) => {
    const angle = turns * index / 72;
    const radius = 3 * Math.exp(growth * angle);
    const cosine = Math.cos(angle + phase);
    const sine = Math.sin(angle + phase);
    return { x: 500 + radius * cosine, y: 500 + radius * sine, dx: radius * (growth * cosine - sine), dy: radius * (growth * sine + cosine) };
  });
  if (reverse) points.reverse();
  const step = (reverse ? -1 : 1) * turns / 72 / 3;
  const coordinates = (...values: number[]) => values.map(value => value.toFixed(3)).join(",");
  return {
    start: coordinates(points[0].x, points[0].y),
    curves: points.slice(1).map((point, index) => {
      const previous = points[index];
      return `C${coordinates(previous.x + previous.dx * step, previous.y + previous.dy * step, point.x - point.dx * step, point.y - point.dy * step, point.x, point.y)}`;
    }).join(" "),
  };
}

const ribbons = colors.map((fill, index) => {
  const phase = index * Math.PI * 2 / colors.length;
  const outer = spiralEdge(phase);
  const inner = spiralEdge(phase + Math.PI * 2 / colors.length, true);
  return { fill, path: `M500,500 L${outer.start} ${outer.curves} L${inner.start} ${inner.curves} Z` };
});

export default function GoldenSpiralTransition() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;
    const texture = document.createElement("canvas");
    const textureContext = texture.getContext("2d", { alpha: false });
    if (!textureContext) return;
    const paths = ribbons.map(ribbon => ({ ...ribbon, shape: new Path2D(ribbon.path) }));
    const starPoints = star.split(" ").map(point => point.split(",").map(Number));
    const started = performance.now();
    let frame = 0;
    let width = 0;
    let height = 0;
    let density = 0;
    let diameter = 0;

    const draw = (now: number) => {
      const progress = Math.min(1, (now - started) / GOLDEN_SPIRAL_DURATION_MS);
      const eased = progress * progress * (3 - 2 * progress);
      context.setTransform(density, 0, 0, density, width / 2 * density, height / 2 * density);
      context.save();
      context.rotate((28 - 508 * eased) * Math.PI / 180);
      // Reuse a native-resolution texture without enlarging its pixels.
      context.drawImage(texture, -diameter / 2, -diameter / 2, diameter, diameter);
      context.restore();

      context.save();
      const depth = diameter / 1000 * phi ** (2 * eased);
      context.scale(depth, depth);
      context.rotate(Math.PI * eased);
      context.strokeStyle = "#f5f3eb";
      context.lineWidth = 1.4;
      context.globalAlpha = .5;
      for (let index = 0; index < 9; index++) {
        const frameWidth = 920 / phi ** index;
        const frameHeight = frameWidth / phi;
        context.save();
        context.rotate(-index * Math.PI / 2);
        context.beginPath();
        context.roundRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, frameWidth * .035);
        context.stroke();
        context.restore();
      }
      context.globalAlpha = 1;
      context.strokeStyle = "#20221e";
      context.lineWidth = 2;
      for (const [x, y, size, rotation, fill] of [
        [176, -154, .65, 18, "#d2f65a"],
        [-128, 94, .36, -18, "#ff7049"],
        [19, -39, .18, 0, "#f5f3eb"],
      ] as const) {
        context.save();
        context.translate(x, y);
        context.rotate(rotation * Math.PI / 180);
        context.scale(size, size);
        context.beginPath();
        starPoints.forEach(([px, py], index) => index === 0 ? context.moveTo(px - 50, py - 50) : context.lineTo(px - 50, py - 50));
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        context.stroke();
        context.restore();
      }
      context.restore();
      if (progress < 1) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextDensity = Math.min(window.devicePixelRatio || 1, 2);
      if (bounds.width === width && bounds.height === height && nextDensity === density) return;
      width = bounds.width;
      height = bounds.height;
      density = nextDensity;
      diameter = Math.hypot(width, height) + 2;
      canvas.width = Math.ceil(width * density);
      canvas.height = Math.ceil(height * density);
      texture.width = texture.height = Math.ceil(diameter * density);
      const scale = texture.width / 1000;
      textureContext.setTransform(scale, 0, 0, scale, texture.width / 2, texture.height / 2);
      for (const { fill, shape } of paths) {
        textureContext.fillStyle = fill;
        textureContext.save();
        textureContext.translate(-500, -500);
        textureContext.fill(shape);
        textureContext.restore();
      }
      textureContext.fillStyle = "#20221e";
      textureContext.beginPath();
      textureContext.arc(0, 0, 4, 0, Math.PI * 2);
      textureContext.fill();
      cancelAnimationFrame(frame);
      draw(performance.now());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
      texture.width = texture.height = 0;
    };
  }, []);

  return <div className="stats-transition golden-tunnel" style={{ "--stats-transition-duration": `${GOLDEN_SPIRAL_DURATION_MS}ms` } as CSSProperties} aria-hidden="true" data-testid="stats-transition">
    <canvas ref={canvasRef} className="golden-tunnel-art" />
    <div className="golden-tunnel-shade" />
    <div className="golden-tunnel-title"><span>N J</span><strong>Rewind</strong></div>
    <div className="golden-tunnel-wipe" />
  </div>;
}
