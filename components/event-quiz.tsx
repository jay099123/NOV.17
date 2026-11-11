"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, X } from "lucide-react";
import type { EventMemory, EventQuiz as QuizContent } from "@/data/memory-types";

export default function EventQuiz({ event, quiz, onComplete, onPlayMusic, onResultStart, muted, volume }: { event: EventMemory; quiz: QuizContent; onComplete: (allCorrect: boolean) => void; onPlayMusic: () => Promise<boolean>; onResultStart: () => void; muted: boolean; volume: number }) {
  const pathname = usePathname();
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<boolean[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const locked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const drum = useRef<HTMLAudioElement>(null);
  const question = quiz.questions[answers.length];

  useEffect(() => {
    if (revealed) resultHeading.current?.focus({ preventScroll: true });
    else if (!result) heading.current?.focus({ preventScroll: true });
  }, [answers.length, result, revealed]);
  useEffect(() => { if (drum.current) drum.current.volume = volume; }, [volume]);
  useEffect(() => {
    const audio = drum.current;
    return () => { audio?.pause(); };
  }, [pathname]);
  useEffect(() => {
    if (selected === null || result || pathname !== `/${event.id}`) return;
    const timer = window.setTimeout(() => {
      const next = [...answers, selected];
      if (next.length === quiz.questions.length) {
        setResult(next.map((answer, index) => answer === quiz.questions[index].answer));
      } else {
        setAnswers(next);
        setSelected(null);
        locked.current = false;
      }
    }, 260);
    return () => window.clearTimeout(timer);
  }, [selected, answers, quiz, result, pathname, event.id]);
  useEffect(() => {
    if (!result || pathname !== `/${event.id}`) return;
    const timer = window.setTimeout(() => {
      drum.current?.pause();
      setRevealed(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [result, pathname, event.id]);
  useEffect(() => {
    if (!result || !revealed || pathname !== `/${event.id}`) return;
    const timer = window.setTimeout(() => onComplete(result.every(Boolean)), result.every(Boolean) ? 2200 : 4200);
    return () => window.clearTimeout(timer);
  }, [result, revealed, pathname, event.id, onComplete]);

  return <div className="event-quiz" data-testid="event-quiz">
    <img className="event-quiz-background" src={event.cover.src} alt={event.cover.alt} decoding="async" />
    <audio ref={drum} src={quiz.result.drumSrc} muted={muted} preload="auto" data-testid="quiz-drumroll" />
    {result ? <div className={`quiz-result${revealed ? " is-revealed" : ""}`} data-testid="quiz-result" data-phase={revealed ? "revealed" : "waiting"}>
      <div className="quiz-stage-lights" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="quiz-stage-floor" aria-hidden="true" />
      <div className="quiz-result-content" role="status" aria-live="polite" aria-atomic="true">
        {revealed ? <div className="quiz-result-announcement">
          <h2 ref={resultHeading} tabIndex={-1} data-testid="quiz-result-title">{result.every(Boolean) ? quiz.result.correctTitle : quiz.result.incorrectTitle}</h2>
          {!result.every(Boolean) && <ol className="quiz-result-answers">
            {result.map((correct, index) => <li key={index} data-correct={correct}>
              <span>{quiz.result.questionLabel.replaceAll("{number}", String(index + 1))}</span>
              <strong>{correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{correct ? quiz.result.correctLabel : quiz.result.incorrectLabel}</strong>
            </li>)}
          </ol>}
        </div> : <p className="quiz-result-waiting">{quiz.result.waitingText}</p>}
      </div>
    </div> : <div className="event-quiz-card">
      <h1>{quiz.title}</h1>
      <div className="event-quiz-question" key={answers.length}>
        <p className="event-quiz-progress">{quiz.progressLabel.replaceAll("{current}", String(answers.length + 1)).replaceAll("{total}", String(quiz.questions.length))}</p>
        <h2 ref={heading} tabIndex={-1}>{question.prompt}</h2>
        <div className="event-quiz-options">
          {question.options.map(option => <button type="button" key={option.id} disabled={selected !== null} aria-pressed={selected === option.id} data-option={option.id} onClick={() => {
            if (locked.current) return;
            locked.current = true;
            if (answers.length === quiz.questions.length - 1) {
              onResultStart();
              if (drum.current) {
                drum.current.currentTime = 0;
                void drum.current.play().catch(() => { /* The visual result still works without sound. */ });
              }
            } else void onPlayMusic();
            setSelected(option.id);
          }}><span>{option.id}</span>{option.text}</button>)}
        </div>
      </div>
    </div>}
  </div>;
}
