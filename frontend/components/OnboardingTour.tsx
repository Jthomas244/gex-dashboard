"use client";

import { useState, useEffect, useCallback } from "react";
import { tourSteps } from "@/lib/educational-content";

interface OnboardingTourProps {
  active: boolean;
  onComplete: () => void;
}

export default function OnboardingTour({
  active,
  onComplete,
}: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = tourSteps[step];

  const measureTarget = useCallback(() => {
    if (!currentStep?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      // Scroll into view on mobile
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!active) return;
    measureTarget();
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [active, step, measureTarget]);

  if (!active) return null;

  const isFirst = step === 0;
  const isLast = step === tourSteps.length - 1;
  const isFullPageModal = !currentStep.target;

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Spotlight cutout dimensions with padding
  const pad = 12;
  const spotlight = targetRect
    ? {
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : null;

  // Calculate card position relative to spotlight
  const getCardPosition = () => {
    if (!spotlight) return {};
    const cardWidth = 360;
    const cardHeight = 200;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Try below the spotlight
    if (spotlight.top + spotlight.height + cardHeight + 20 < viewportH) {
      return {
        top: spotlight.top + spotlight.height + 16,
        left: Math.max(
          16,
          Math.min(
            spotlight.left + spotlight.width / 2 - cardWidth / 2,
            viewportW - cardWidth - 16
          )
        ),
      };
    }
    // Try above
    if (spotlight.top - cardHeight - 20 > 0) {
      return {
        top: spotlight.top - cardHeight - 16,
        left: Math.max(
          16,
          Math.min(
            spotlight.left + spotlight.width / 2 - cardWidth / 2,
            viewportW - cardWidth - 16
          )
        ),
      };
    }
    // Fallback: center
    return {
      top: viewportH / 2 - cardHeight / 2,
      left: viewportW / 2 - cardWidth / 2,
    };
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight glow border */}
      {spotlight && (
        <div
          className="absolute rounded-xl border-2 border-[var(--accent)]/60 pointer-events-none shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Tour card */}
      <div
        className={`absolute z-10 w-[360px] max-w-[calc(100vw-2rem)] bg-[var(--bg-surface)] border border-white/10 rounded-xl shadow-2xl animate-tooltip-in ${
          isFullPageModal
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : ""
        }`}
        style={isFullPageModal ? {} : getCardPosition()}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
            {currentStep.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {currentStep.body}
          </p>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]/50"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              {step + 1}/{tourSteps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="px-3 py-1.5 rounded-md text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors"
            >
              {isLast ? "Got it, let's go" : "Next"}
            </button>
          </div>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="px-5 pb-3 -mt-1">
            <button
              onClick={onComplete}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Skip tour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
