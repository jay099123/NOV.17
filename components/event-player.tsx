"use client";

import type { CSSProperties } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { EventMemory } from "@/data/memory-types";

export const formatTime = (seconds: number) => {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};

type EventPlayerProps = {
  event: EventMemory;
  index: number;
  total: number;
  playing: boolean;
  elapsed: number;
  duration: number;
  volume: number;
  muted: boolean;
  audioError: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlayback: () => void;
  onSeek: (time: number) => void;
  onVolume: (volume: number) => void;
  onMute: () => void;
};

export default function EventPlayer({ event, index, total, playing, elapsed, duration, volume, muted, audioError, onPrevious, onNext, onTogglePlayback, onSeek, onVolume, onMute }: EventPlayerProps) {
  const progress = duration > 0 ? Math.min(100, elapsed / duration * 100) : 0;
  const last = index === total - 1;
  const hasPhotos = Boolean(event.photos?.length);
  return <div className={`event-page${hasPhotos ? " has-photos" : ""}`} data-testid="event-player" data-event={event.id}>
    {event.id === "memo-1" && <div className="event-ambient" aria-hidden="true">
      <img src={event.cover.src} alt="" decoding="async" />
    </div>}
    <section className="event-music" aria-label="音樂播放器">
      <div className="event-music-inner">
        <img className="event-cover" src={event.cover.src} alt={event.cover.alt} decoding="async" data-testid="event-cover" />
        <div className="event-track">
          <h1 className="event-track-title" title={event.song.title}>{event.song.title}</h1>
          <p className="event-track-artist" title={event.song.artist}>{event.song.artist}</p>
        </div>
        <div className="event-progress">
          <input type="range" className="event-range event-seek" aria-label="播放進度" aria-valuetext={`${formatTime(elapsed)} / ${formatTime(duration)}`} min={0} max={duration || 1} step={0.1} value={Math.min(elapsed, duration || 0)} disabled={duration <= 0} onChange={event => onSeek(Number(event.currentTarget.value))} style={{ "--range-fill": `${progress}%` } as CSSProperties} />
          <div className="event-times"><span data-testid="elapsed-time">{formatTime(elapsed)}</span><span data-testid="remaining-time">-{formatTime(duration - elapsed)}</span></div>
        </div>
        <div className="event-playback">
          <button type="button" className="event-skip" aria-label="上一個事件" disabled={index === 0} onClick={onPrevious}><SkipBack fill="currentColor" aria-hidden="true" /></button>
          <button type="button" className="event-play-toggle" aria-label={playing ? "暫停音樂" : "播放音樂"} onClick={onTogglePlayback} data-testid="event-play-toggle">{playing ? <Pause fill="currentColor" aria-hidden="true" /> : <Play fill="currentColor" aria-hidden="true" />}</button>
          <button type="button" className="event-skip" aria-label={last ? "從第一個事件重新播放" : "下一個事件"} onClick={onNext}>{last ? <RotateCcw aria-hidden="true" /> : <SkipForward fill="currentColor" aria-hidden="true" />}</button>
        </div>
        <div className="event-volume">
          <button type="button" className="event-mute" aria-label={muted ? "取消靜音" : "靜音音樂"} aria-pressed={muted} onClick={onMute}>{muted || volume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</button>
          <input type="range" className="event-range" aria-label="網站音量" aria-valuetext={`${Math.round(volume * 100)}%`} min={0} max={1} step={0.01} value={volume} onChange={event => onVolume(Number(event.currentTarget.value))} style={{ "--range-fill": `${volume * 100}%` } as CSSProperties} />
          <Volume2 className="event-volume-high" aria-hidden="true" />
        </div>
        {audioError && <p className="event-audio-error" role="status">音樂暫時無法播放，請按播放鍵重試。</p>}
      </div>
    </section>
    <section className="event-story" aria-label="回憶文字">
      <div className="event-story-lines">
        {event.lines.map((line, lineIndex) => <p key={lineIndex} className="event-line" style={{ "--intro-delay": `${.15 + lineIndex * .8}s` } as CSSProperties}>{line}</p>)}
      </div>
    </section>
    {hasPhotos && <section className="event-photos" aria-label="回憶照片">
      {event.photos?.map((photo, photoIndex) => <figure className="event-snapshot" key={`${photo.src}-${photoIndex}`}>
        <img src={photo.src} alt={photo.alt} decoding="async" />
      </figure>)}
    </section>}
  </div>;
}
