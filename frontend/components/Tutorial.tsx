"use client";

import { useCallback, useEffect, useState } from "react";
import { tutorialSteps, quiz } from "@/lib/tutorial-content";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when the user finishes and asks for the UI tour next. */
  onStartTour: () => void;
}

const TOTAL = tutorialSteps.length + 1; // + quiz

export default function Tutorial({ open, onClose, onStartTour }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz.map(() => null));

  const isQuiz = step === tutorialSteps.length;
  const current = tutorialSteps[step];

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers(quiz.map(() => null));
    }
  }, [open]);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL - 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return; // holding a key shouldn't fly through steps
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, next, prev]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const answeredAll = answers.every((a) => a !== null);
  const score = answers.filter((a, i) => a === quiz[i].answer).length;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[960px] max-h-[92vh] card overflow-hidden flex flex-col animate-scale-in">
        {/* Progress */}
        <div className="h-[3px] bg-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-accent to-pos transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-7 pt-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-3 font-medium">
            <span className="w-5 h-5 rounded-md bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold">
              {step + 1}
            </span>
            {isQuiz ? "Quick check" : current.eyebrow}
            <span className="text-fg-3/60">· {step + 1} of {TOTAL}</span>
          </div>
          <button
            onClick={onClose}
            className="text-fg-3 hover:text-fg transition-colors text-xl leading-none px-1"
            aria-label="Close tutorial"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5 md:min-h-[400px]">
          {!isQuiz ? (
            <div key={current.id} className="grid md:grid-cols-[1.1fr_1fr] gap-6 md:gap-8 items-start animate-fade-in">
              <div>
                <h2 id="tutorial-title" className="text-[22px] md:text-[26px] font-semibold tracking-tight leading-tight mb-4">
                  {current.title}
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-fg-2 [&_strong]:text-fg [&_strong]:font-semibold [&_em]:text-fg">
                  {current.body}
                </div>
                {current.takeaway && (
                  <div className="mt-5 flex gap-3 rounded-xl border border-accent/25 bg-accent/[0.07] px-4 py-3">
                    <span className="text-accent text-base leading-none mt-0.5">★</span>
                    <p className="text-[13px] text-fg leading-relaxed">{current.takeaway}</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-line bg-black/30 aspect-[16/9] md:aspect-auto md:min-h-[300px] p-4 flex items-center">
                {current.illustration}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in max-w-2xl">
              <h2 id="tutorial-title" className="text-[22px] md:text-[26px] font-semibold tracking-tight leading-tight mb-1">
                Quick check
              </h2>
              <p className="text-fg-2 text-[14px] mb-6">Three questions. Instant feedback — no pressure.</p>

              <div className="space-y-5">
                {quiz.map((q, qi) => {
                  const chosen = answers[qi];
                  return (
                    <div key={qi} className="rounded-xl border border-line bg-white/[0.02] p-4">
                      <div className="text-[14px] text-fg font-medium mb-3">
                        <span className="text-fg-3 font-data mr-2">{qi + 1}.</span>
                        {q.q}
                      </div>
                      <div className="grid gap-2">
                        {q.options.map((opt, oi) => {
                          const isChosen = chosen === oi;
                          const isCorrect = oi === q.answer;
                          const revealed = chosen !== null;
                          return (
                            <button
                              key={oi}
                              disabled={revealed}
                              onClick={() =>
                                setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))
                              }
                              className={clsx(
                                "text-left rounded-lg border px-3.5 py-2.5 text-[13.5px] transition-colors",
                                !revealed && "border-line hover:border-line-strong hover:bg-white/[0.04] text-fg-2 hover:text-fg",
                                revealed && isCorrect && "border-pos/50 bg-pos/10 text-fg",
                                revealed && isChosen && !isCorrect && "border-neg/50 bg-neg/10 text-fg",
                                revealed && !isChosen && !isCorrect && "border-line text-fg-3 opacity-60"
                              )}
                            >
                              <span className="font-data text-[11px] mr-2 text-fg-3">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {chosen !== null && (
                        <p
                          className={clsx(
                            "mt-3 text-[13px] leading-relaxed animate-fade-in",
                            chosen === q.answer ? "text-pos" : "text-fg-2"
                          )}
                        >
                          {chosen === q.answer ? "Correct. " : "Not quite. "}
                          <span className="text-fg-2">{q.why}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {answeredAll && (
                <div className="mt-6 rounded-xl border border-accent/30 bg-accent/[0.08] p-4 animate-fade-in">
                  <div className="text-fg font-semibold mb-1">
                    {score === quiz.length ? "3/3 — you've got the core model." : `${score}/${quiz.length} — solid start.`}
                  </div>
                  <p className="text-[13px] text-fg-2">
                    You can reopen this any time from the <strong className="text-fg">GEX 101</strong> button, and the{" "}
                    <strong className="text-fg">Reference</strong> panel has a glossary. Want a 60-second tour of the
                    dashboard controls next?
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 md:px-7 py-4 border-t border-line">
          <div className="flex items-center gap-1.5">
            {[...Array(TOTAL)].map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-5 bg-accent" : i < step ? "w-1.5 bg-accent/50" : "w-1.5 bg-white/15 hover:bg-white/30"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] text-fg-3 mr-2 font-data">← → to navigate · Esc to close</span>
            {step > 0 && (
              <button onClick={prev} className="btn">
                Back
              </button>
            )}
            {!isQuiz ? (
              <button onClick={next} className="btn btn-primary">
                {step === tutorialSteps.length - 1 ? "Quick check" : "Next"}
              </button>
            ) : answeredAll ? (
              <>
                <button onClick={onClose} className="btn">
                  Go to dashboard
                </button>
                <button onClick={onStartTour} className="btn btn-primary">
                  Tour the controls
                </button>
              </>
            ) : (
              <button onClick={onClose} className="btn">
                Skip check
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
