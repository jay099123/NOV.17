"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Play, Volume2, VolumeX, X } from "lucide-react";
import { events, project } from "@/data/memories";
import type { IntroContent } from "@/data/memory-types";
import RewindYears from "@/components/rewind-years";
import RelationshipStats from "@/components/relationship-stats";
import EventPlayer from "@/components/event-player";

const developmentAudioControls = process.env.NODE_ENV === "development";
const developmentMuteKey = "nov17:dev-audio-muted";

function HomepageStar({ className = "" }: { className?: string }) {
  return <svg className={`homepage-spark ${className}`} viewBox="0 0 100 100" aria-hidden="true">
    <polygon points="50,2 61,36 97,36 68,57 79,92 50,71 21,92 32,57 3,36 39,36" fill="currentColor" />
  </svg>;
}

function Cover({ onEnter, onPlayMusic, musicPlaying }: {
  onEnter: () => void;
  onPlayMusic: () => Promise<boolean>;
  musicPlaying: boolean;
}) {
  const pathname = usePathname();
  const phase = useRef<"idle" | "starting" | "playing" | "entering">("idle");
  const enterRequested = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = pathname === "/home";
    if (!active.current) { phase.current = "idle"; enterRequested.current = false; }
    return () => { active.current = false; };
  }, [pathname]);
  const beginMusic = async () => {
    if (!active.current || pathname !== "/home" || phase.current === "entering") return;
    if (phase.current === "playing") { phase.current = "entering"; onEnter(); return; }
    if (phase.current === "starting") { enterRequested.current = true; return; }
    phase.current = "starting";
    const playing = await onPlayMusic();
    if (!active.current) return;
    if (!playing) { phase.current = "idle"; enterRequested.current = false; return; }
    phase.current = "playing";
    if (enterRequested.current) { phase.current = "entering"; onEnter(); }
  };
  return <div className="homepage" onClick={() => { void beginMusic(); }}>
    <div className="homepage-heading">
      <h1 className="homepage-title">{project.name}</h1>
      <p className="homepage-greeting">{project.greeting}</p>
    </div>
    <button className="homepage-portrait" onClick={(event) => {
      event.stopPropagation();
      void beginMusic();
    }} aria-label={musicPlaying ? "進入音樂序章" : "播放主頁音樂"} aria-pressed={musicPlaying} data-testid="homepage-music">
      <img className="homepage-cutout" src={project.photo.src} alt={project.photo.alt} decoding="async" fetchPriority="high" data-photo-src={project.photo.src} />
    </button>
    <HomepageStar className="spark-left" />
    <HomepageStar className="spark-right" />
  </div>;
}

function Intro({ content, onStart, prelude = false }: { content: IntroContent; onStart: () => void; prelude?: boolean }) {
  return <div className={`intro-page${prelude ? " prelude-page" : ""}`}>
    <div className="intro-copy">
      {content.lines.map((line, index) => {
        const style = { "--intro-delay": `${.15 + index * .8}s` } as CSSProperties;
        return index === 0
          ? <h1 key={index} className="intro-line intro-title" style={style}>{line}</h1>
          : <p key={index} className="intro-line" style={style}>{line}</p>;
      })}
    </div>
    <button className="intro-play" onClick={onStart} aria-label={content.playLabel} style={{ "--intro-delay": `${.15 + content.lines.length * .8}s` } as CSSProperties} data-testid={prelude ? "prelude-continue" : "start"}>
      {prelude ? <ArrowRight aria-hidden="true" /> : <Play fill="currentColor" strokeWidth={1.5} aria-hidden="true" />}
    </button>
    <RewindYears />
    <HomepageStar className="spark-left" />
    <HomepageStar className="spark-right" />
  </div>;
}

export default function MemoryPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const index = events.findIndex(event => pathname === `/${event.id}`);
  const event = events[index];
  const isEvent = index !== -1;
  const isBlank = index === 4 || index === 6;
  const isHome = pathname === "/home";
  const isPrelude = pathname === "/prelude";
  const isIntro = pathname === "/intro";
  const isStats = pathname === "/stats";
  const [direction, setDirection] = useState(1);
  const [audioError, setAudioError] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(.35);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsMusic = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const introContent = isPrelude
    ? project.prelude ?? { lines: ["關於我們的音樂故事"], playLabel: "前往歡迎頁" }
    : project.intro ?? { lines: ["歡迎來到 OUR REWIND", "準備好了嗎", "一起開始吧"], playLabel: "開始回顧" };
  const song = event?.song ?? project.song;
  const eventId = event?.id;
  const colors = project.colors;
  const themeStyle = colors ? {
    "--accent": colors.background,
    "--secondary": colors.photoBackground,
    "--ink": colors.text,
    "--accent-ink": colors.bodyText ?? colors.text,
  } as CSSProperties : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = .35;
    if (!developmentAudioControls) return;
    try {
      const restored = localStorage.getItem(developmentMuteKey) === "true";
      audio.muted = restored;
      setMuted(restored);
    } catch { /* Playback controls still work when browser storage is unavailable. */ }
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.muted;
    audio.muted = next;
    setMuted(next);
    if (developmentAudioControls) {
      try { localStorage.setItem(developmentMuteKey, String(next)); }
      catch { /* Keep the current session usable without persistent storage. */ }
    }
  };

  const playMusic = useCallback((): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve(false);
    wantsMusic.current = true;
    setAudioError(false);
    return audio.play().then(() => !audio.paused).catch((error: DOMException) => {
      if (error.name !== "AbortError" && wantsMusic.current) setAudioError(true);
      return false;
    });
  }, []);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void playMusic();
    else { wantsMusic.current = false; audio.pause(); }
  }, [playMusic]);

  useEffect(() => {
    if (!isHome) return;
    wantsMusic.current = false;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [isHome]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let active = true;
    wantsMusic.current = Boolean(eventId) || wantsMusic.current;
    setElapsed(0);
    setDuration(0);
    setAudioError(false);
    audio.load();
    if (wantsMusic.current) audio.play().catch((error: DOMException) => {
      if (active && error.name !== "AbortError" && wantsMusic.current) setAudioError(true);
    });
    return () => { active = false; };
  }, [song.src, eventId]);

  const enterPrelude = useCallback(() => { router.push("/prelude", { scroll: false }); }, [router]);
  const enterIntro = useCallback(() => { router.push("/intro", { scroll: false }); }, [router]);
  const enterStats = useCallback(() => { void playMusic(); router.push("/stats", { scroll: false }); }, [playMusic, router]);
  const start = useCallback(() => { wantsMusic.current = true; router.push("/memo-1", { scroll: false }); }, [router]);
  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= events.length) return;
    setDirection(next >= index ? 1 : -1);
    wantsMusic.current = true;
    router.push(`/${events[next].id}`, { scroll: false });
  }, [index, router]);
  const home = () => {
    wantsMusic.current = false;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    router.push("/home", { scroll: false });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isEvent || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEvent, goTo, index]);

  const readDuration = () => {
    const value = audioRef.current?.duration ?? 0;
    setDuration(Number.isFinite(value) && value > 0 ? value : 0);
  };
  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration));
    setElapsed(audio.currentTime);
  };
  const changeVolume = (value: number) => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, value));
  };
  const screen = isEvent ? "event" : isPrelude ? "prelude" : isIntro ? "intro" : isStats ? "stats" : "homepage";

  return <MotionConfig reducedMotion="user"><main className={`site-shell is-${screen}${isBlank ? " is-blank-event" : ""} palette-${project.palette ?? "lime"}`} style={themeStyle}>
    <audio ref={audioRef} src={song.src} muted={muted} loop preload="metadata" onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)} onTimeUpdate={event => setElapsed(event.currentTarget.currentTime)} onLoadedMetadata={readDuration} onDurationChange={readDuration} onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }} onError={() => setAudioError(true)} data-testid="audio" />
    {developmentAudioControls && isEvent && !isBlank && <button type="button" className="dev-audio-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? "恢復背景音樂" : "靜音背景音樂"} data-testid="dev-audio-mute">
      <span className="dev-audio-badge">開發</span>
      {muted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
      <span>{muted ? "已靜音" : "靜音"}</span>
    </button>}
    {(isPrelude || isIntro || isStats) && <header className="slide-brand"><button type="button" className="page-back" onClick={isPrelude ? home : isIntro ? enterPrelude : enterIntro} aria-label={isPrelude ? "返回主頁" : isIntro ? "返回音樂序章" : "返回歡迎頁"} data-testid="page-back"><ArrowLeft aria-hidden="true" /></button></header>}
    {isEvent && !isBlank && <button type="button" className="event-close" aria-label="返回統計頁" onClick={enterStats}><X aria-hidden="true" /></button>}
    <section className="story-stage" aria-label={isEvent ? "事件回顧" : "年度回顧投影片"}>
      <div className="slide-viewport" onTouchStart={event => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }} onTouchEnd={event => {
        const origin = touchStart.current;
        touchStart.current = null;
        if (!origin || !isEvent || (event.target as HTMLElement).closest("button, input")) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - origin.x, dy = touch.clientY - origin.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(index + (dx < 0 ? 1 : -1));
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div className="slide-page" key={pathname} initial={{ opacity: 0, x: reduceMotion ? 0 : direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduceMotion ? 0 : direction * -18 }} transition={{ duration: reduceMotion ? 0 : .2 }} data-testid={isEvent ? "event-page" : isPrelude ? "prelude" : isIntro ? "intro" : isStats ? "stats" : "cover"} data-event={eventId}>
            {isEvent ? isBlank
              ? <button type="button" className="blank-event-next" aria-label="下一個事件" onClick={() => goTo(index + 1)} />
              : <EventPlayer event={event} index={index} total={events.length} playing={musicPlaying} elapsed={elapsed} duration={duration} volume={volume} muted={muted} audioError={audioError} onPrevious={() => goTo(index - 1)} onNext={() => goTo(index === events.length - 1 ? 0 : index + 1)} onTogglePlayback={togglePlayback} onSeek={seek} onVolume={changeVolume} onMute={toggleMute} />
              : isStats ? <RelationshipStats content={project.stats} onStart={start} onPlayMusic={playMusic} />
              : isPrelude || isIntro ? <Intro content={introContent} onStart={isPrelude ? enterIntro : enterStats} prelude={isPrelude} />
              : isHome ? <Cover onEnter={enterPrelude} onPlayMusic={playMusic} musicPlaying={musicPlaying} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  </main></MotionConfig>;
}
