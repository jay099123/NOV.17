"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Headphones, Heart, Mail, Play, RotateCcw, Sparkles, Star, Ticket } from "lucide-react";
import { memories, project } from "@/data/memories";
import type { Memory, Photo } from "@/data/memory-types";

const pad = (value: number) => String(value).padStart(2, "0");
const concertCount = memories.filter((memory) => memory.kind === "concert").length;

function Flower({ className = "" }: { className?: string }) {
  return <svg className={`flower ${className}`} viewBox="0 0 200 200" aria-hidden="true">
    {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="100" cy="53" rx="18" ry="48" transform={`rotate(${i * 30} 100 100)`} fill="currentColor" />)}
    <circle cx="100" cy="100" r="25" className="flower-center" />
  </svg>;
}

function PhotoVisual({ photo }: { photo: Photo }) {
  return <img className="photo-visual" src={photo.src} alt={photo.alt} loading="lazy" decoding="async" data-photo-src={photo.src} />;
}

function PhotoFrame({ photo, className = "" }: { photo: Photo; className?: string }) {
  return <figure className={`photo-frame ${className}`}><div className="photo-window"><PhotoVisual photo={photo} /></div><figcaption><span>{photo.caption}</span><ArrowUpRight size={13} /></figcaption></figure>;
}

function Cover({ onStart, onToggleMusic, musicPlaying }: { onStart: () => void; onToggleMusic: () => void; musicPlaying: boolean }) {
  return <div className="homepage">
    <div className="homepage-heading">
      <h1 className="homepage-title">{project.name}</h1>
      <p className="homepage-greeting">{project.greeting}</p>
    </div>
    <button className={`homepage-portrait ${musicPlaying ? "is-playing" : ""}`} onClick={onToggleMusic} aria-label={musicPlaying ? "暫停主頁音樂" : "播放主頁音樂"} aria-pressed={musicPlaying} data-testid="homepage-music">
      <img className="homepage-cutout" src={project.photo.src} alt={project.photo.alt} decoding="async" fetchPriority="high" data-photo-src={project.photo.src} />
    </button>
    <div className="homepage-actions">
      <p className="homepage-music-hint" aria-live="polite"><Headphones size={12} />{musicPlaying ? project.musicPlayingText : project.musicHint}</p>
      <button className="start-button" onClick={onStart} data-testid="start"><span className="button-play"><Play size={17} fill="currentColor" /></span>{project.startText}<ArrowUpRight size={20} /></button>
    </div>
    <span className="homepage-spark spark-left" aria-hidden="true">✳</span>
    <span className="homepage-spark spark-right" aria-hidden="true">✳</span>
  </div>;
}

function Quiz({ memory, selected, onAnswer }: { memory: Memory; selected?: number; onAnswer: (answer: number) => void }) {
  if (!memory.quiz) return null;
  const quiz = memory.quiz;
  return <div className="quiz-block">
    <p className="quiz-prompt">{quiz.prompt}</p>
    <div className="quiz-options">{quiz.options.map((option, i) => {
      const correct = selected !== undefined && i === quiz.answer;
      const wrong = selected === i && i !== quiz.answer;
      return <button key={option} className={`quiz-option ${correct ? "is-correct" : ""} ${wrong ? "is-wrong" : ""}`} disabled={selected !== undefined} onClick={() => onAnswer(i)} data-testid={`option-${i}`}><span>{String.fromCharCode(65 + i)}</span>{option}{correct ? <Check size={16} /> : <ArrowUpRight size={15} />}</button>;
    })}</div>
    {selected !== undefined && <motion.p className="quiz-reveal" role="status" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}><Heart size={14} fill="currentColor" />{quiz.reveal}</motion.p>}
  </div>;
}

function MemoryArt({ memory, collected }: { memory: Memory; collected: boolean }) {
  return <div className={`memory-art art-${memory.kind} ${collected ? "is-collected" : ""}`}>
    <span className="art-big-type" aria-hidden="true">{memory.kind === "concert" ? "LIVE" : memory.kind === "birthday" ? "LOVE" : "US."}</span>
    <PhotoFrame photo={memory.photos[0]} className="memory-photo-main" />
    {memory.photos[1] && <PhotoFrame photo={memory.photos[1]} className="memory-photo-small" />}
    <Flower className="memory-flower" />
    {memory.concert && <div className="concert-ticket">
      <div className="ticket-main"><span className="ticket-eyebrow"><Ticket size={13} /> ADMIT TWO · KEEP FOREVER</span><strong>{memory.concert.name}</strong><span>{memory.concert.venue}</span><span className="ticket-barcode" aria-hidden="true" /></div>
      <div className="ticket-stub"><span>LIVE</span><strong>{pad(memory.concert.number)}</strong><span>OF {pad(concertCount)}</span></div>
    </div>}
    {memory.kind === "quiz" && <span className="quiz-art-sticker">HOW WELL<br />DO YOU<br /><strong>KNOW US?</strong><span>?</span></span>}
    {memory.kind === "little-things" && <div className="little-things-orbit" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <Heart key={i} fill="currentColor" style={{ "--i": i } as CSSProperties} />)}</div>}
    {memory.kind === "birthday" && <span className="birthday-sticker">MAKE<br />A WISH<span>♡</span></span>}
    <span className="memory-art-caption">{memory.photos[0].caption}</span>
  </div>;
}

function MemoryCard({ memory, index, selected, onAnswer, collected, onCollect, letterOpen, onLetter }: {
  memory: Memory; index: number; selected?: number; onAnswer: (answer: number) => void;
  collected: boolean; onCollect: () => void; letterOpen: boolean; onLetter: () => void;
}) {
  return <div className={`memory-grid kind-${memory.kind} ${letterOpen ? "letter-open" : ""}`}>
    <div className="memory-copy">
      <div className="memory-heading"><span className="poster-eyebrow">TRACK {pad(index + 1)} / {pad(memories.length)}</span><span className="kind-label">{memory.concert ? <><Ticket size={12} /> LIVE {pad(memory.concert.number)}</> : memory.kind === "quiz" ? "A LITTLE QUIZ" : memory.kind === "birthday" ? "THE BIRTHDAY TRACK" : "A MOMENT OF US"}</span></div>
      <div className="month-mark"><span>{memory.english}<i>’{String(memory.year).slice(2)}</i></span><span className="month-mark-line" /><span>{memory.month}</span></div>
      <p className="memory-label">{memory.label}</p>
      <h2 className="memory-title"><span>{memory.title[0]}</span><span>{memory.title[1]}</span></h2>
      <p className="memory-body">{memory.body}</p>
      <Quiz memory={memory} selected={selected} onAnswer={onAnswer} />
      {memory.interaction && <div className="moment-interaction"><button className={`moment-button ${collected ? "collected" : ""}`} onClick={onCollect} aria-pressed={collected} data-testid="collect-moment"><Heart size={17} fill={collected ? "currentColor" : "none"} />{collected ? "小日子已收藏" : memory.interaction.action}<Sparkles size={16} /></button>{collected && <p className="moment-reveal" role="status">{memory.interaction.reveal}</p>}</div>}
      {memory.letter && <div className="birthday-letter"><button className="moment-button" onClick={onLetter} aria-expanded={letterOpen} data-testid="open-letter"><Mail size={17} />{letterOpen ? "收好這封信" : "打開給你的生日信"}<ArrowUpRight size={16} /></button>{letterOpen && <motion.p className="letter-content" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{memory.letter}</motion.p>}</div>}
      <span className="memory-note">{memory.note}</span>
    </div>
    <MemoryArt memory={memory} collected={collected || letterOpen} />
  </div>;
}

function MonthNavigation({ started, index, timelineRef, onMonth, onStart, onReplay }: {
  started: boolean;
  index: number;
  timelineRef: RefObject<HTMLElement | null>;
  onMonth: (index: number) => void;
  onStart: () => void;
  onReplay: () => void;
}) {
  const lastMonth = started && index === memories.length - 1;
  return <div className="slide-navigation" data-testid="slide-navigation">
    <button className="slide-nav-arrow" disabled={!started || index === 0} onClick={() => onMonth(index - 1)} aria-label="上一個月"><ArrowLeft size={19} /></button>
    <nav className="month-timeline" ref={timelineRef} aria-label="月份時間軸">
      {memories.map((item, i) => <button key={item.id} className={`month-button ${started && i === index ? "active" : ""}`} data-month={item.id} onClick={() => onMonth(i)} aria-label={`前往 ${item.year} 年 ${Number(item.month)} 月${item.concert ? "，演唱會" : ""}`} aria-current={started && i === index ? "step" : undefined}>
        <span className="timeline-year">{i === 0 || item.month === "01" ? item.year : "\u00a0"}</span>
        <span className="timeline-month">{item.english}<span className="timeline-month-number">{item.month}</span></span>
        <span className="timeline-mark">{item.concert ? <Ticket size={11} /> : item.kind === "birthday" ? <Heart size={10} /> : <span />}</span>
      </button>)}
    </nav>
    <button className="slide-nav-arrow nav-next" onClick={() => lastMonth ? onReplay() : started ? onMonth(index + 1) : onStart()} aria-label={lastMonth ? "再播放一次我們的故事" : started ? "下一個月" : "開始回顧"}>{lastMonth ? <RotateCcw size={18} /> : <ArrowRight size={19} />}</button>
  </div>;
}

export default function MemoryPlayer() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [collected, setCollected] = useState<Record<string, boolean>>({});
  const [letterOpen, setLetterOpen] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsMusic = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const memory = memories[index];
  const song = started ? memory.song : project.song;

  const playMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    wantsMusic.current = true;
    audio.volume = 0.35;
    setAudioError(false);
    audio.play().catch((error: DOMException) => {
      if (error.name !== "AbortError" && wantsMusic.current) setAudioError(true);
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let active = true;
    setAudioError(false);
    audio.volume = 0.35;
    audio.load();
    if (wantsMusic.current) audio.play().catch((error: DOMException) => {
      if (active && error.name !== "AbortError" && wantsMusic.current) setAudioError(true);
    });
    return () => { active = false; };
  }, [song.src]);

  const toggleHomepageMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playMusic();
    else { wantsMusic.current = false; audio.pause(); }
  };

  const start = useCallback(() => { setStarted(true); playMusic(); }, [playMusic]);
  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= memories.length) return;
    setDirection(next >= index ? 1 : -1);
    setIndex(next);
    if (!started) start();
  }, [index, started, start]);
  const home = () => {
    wantsMusic.current = false;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setStarted(false);
    setIndex(0);
  };
  const restart = () => {
    setAnswers({}); setCollected({}); setLetterOpen(false); setDirection(-1);
    setStarted(true); wantsMusic.current = true; setIndex(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    playMusic();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        if (started) goTo(index + 1); else start();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        if (started) goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, goTo, index, start]);

  useEffect(() => {
    if (!started) return;
    const timeline = timelineRef.current;
    const selected = timeline?.querySelector<HTMLElement>(`[data-month="${memory.id}"]`);
    if (timeline && selected) timeline.scrollTo({ left: selected.offsetLeft - timeline.clientWidth / 2 + selected.clientWidth / 2, behavior: reduceMotion ? "instant" : "smooth" });
  }, [memory.id, started, reduceMotion]);

  return <MotionConfig reducedMotion="user"><main className={`site-shell palette-${started ? memory.palette : project.palette}`}>
    <audio ref={audioRef} src={song.src} loop preload="metadata" onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)} onError={() => setAudioError(true)} data-testid="audio" />
    {started && <header className="slide-brand">
      <button className="wordmark" onClick={home} aria-label="回到 NOV.17 封面"><Star fill="currentColor" strokeWidth={1.5} aria-hidden="true" /><span>{project.name}</span></button>
    </header>}
    <section className="story-stage" aria-label="年度回顧投影片">
      <div className="slide-viewport" onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }} onTouchEnd={(event) => {
        const origin = touchStart.current;
        touchStart.current = null;
        if (!origin || !started || (event.target as HTMLElement).closest("button, input")) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - origin.x; const dy = touch.clientY - origin.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(index + (dx < 0 ? 1 : -1));
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div className="slide-page" key={started ? memory.id : "cover"} initial={{ opacity: 0, x: reduceMotion ? 0 : direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduceMotion ? 0 : direction * -18 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} data-testid={started ? "memory-card" : "cover"} data-month={started ? memory.id : undefined}>
            {started ? <MemoryCard memory={memory} index={index} selected={answers[memory.id]} onAnswer={(answer) => setAnswers((previous) => ({ ...previous, [memory.id]: answer }))} collected={Boolean(collected[memory.id])} onCollect={() => setCollected((previous) => ({ ...previous, [memory.id]: !previous[memory.id] }))} letterOpen={letterOpen} onLetter={() => setLetterOpen((previous) => !previous)} /> : <Cover onStart={start} onToggleMusic={toggleHomepageMusic} musicPlaying={musicPlaying} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <MonthNavigation started={started} index={index} timelineRef={timelineRef} onMonth={goTo} onStart={start} onReplay={restart} />
    </section>
    {audioError && <span className="sr-only" role="status">背景音樂尚未播放。</span>}
  </main></MotionConfig>;
}
