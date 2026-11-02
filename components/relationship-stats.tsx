"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { StatsContent } from "@/data/memory-types";

export default function RelationshipStats({ content, onStart, onPlayMusic }: { content: StatsContent; onStart: () => void; onPlayMusic: () => Promise<boolean> }) {
  const [transitioning, setTransitioning] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.floor((Date.now() - Date.parse(content.since)) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [content.since]);

  useEffect(() => {
    if (pathname !== "/stats") { setTransitioning(false); return; }
    if (!transitioning) return;
    if (reduceMotion) { onStart(); return; }
    const timer = window.setTimeout(onStart, 2400);
    return () => window.clearTimeout(timer);
  }, [transitioning, reduceMotion, onStart, pathname]);

  const beginTransition = () => {
    if (transitioning || pathname !== "/stats") return;
    void onPlayMusic();
    if (reduceMotion) onStart();
    else setTransitioning(true);
  };

  return <div className="stats-page" aria-busy={transitioning}>
    {transitioning && <div className="stats-transition" aria-hidden="true" data-testid="stats-transition">
      <div className="stats-transition-disc" />
      <div className="stats-transition-stripes" />
      <svg className="stats-transition-star" viewBox="0 0 100 100"><polygon points="50,0 60,31 85,15 69,40 100,50 69,60 85,85 60,69 50,100 40,69 15,85 31,60 0,50 31,40 15,15 40,31" /></svg>
      <span className="stats-transition-type">N J<span>Rewind</span></span>
      <div className="stats-transition-wipe" />
    </div>}
    <svg className="homepage-spark spark-left" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,2 61,36 97,36 68,57 79,92 50,71 21,92 32,57 3,36 39,36" fill="currentColor" /></svg>
    <svg className="homepage-spark spark-right" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,2 61,36 97,36 68,57 79,92 50,71 21,92 32,57 3,36 39,36" fill="currentColor" /></svg>
    <div className="stats-content">
      <div className="stats-lines" data-testid="stats-lines">
        {content.lines.map((line, index) => <p className="stats-line" key={index} style={{ "--intro-delay": `${.15 + index * .8}s` } as CSSProperties}>
          {line.split(/(\{seconds\}|\d+|∞)/g).map(part => part.trim()).filter(Boolean).map((part, partIndex) => <Fragment key={partIndex}>
            {partIndex > 0 ? " " : null}
            {/^(?:\{seconds\}|\d+|∞)$/.test(part)
              ? <strong className={`stats-number${part === "∞" ? " stats-infinity" : ""}`} data-testid={part === "{seconds}" ? "stats-seconds" : undefined}>{part === "{seconds}" ? seconds?.toLocaleString("en-US").replaceAll(",", ", ") ?? "—" : part}</strong>
              : <span>{part}</span>}
          </Fragment>)}
        </p>)}
      </div>
      <button type="button" className="stats-continue" onClick={beginTransition} disabled={transitioning} aria-label={content.playLabel} style={{ "--intro-delay": `${.15 + content.lines.length * .8}s` } as CSSProperties} data-testid="stats-continue"><ArrowRight aria-hidden="true" /></button>
    </div>
  </div>;
}
