"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { glossary } from "@/lib/educational-content";

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

export default function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const definition = glossary[term.toLowerCase()];
  if (!definition) return <>{children || term}</>;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!visible || !isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, isMobile]);

  const toggle = useCallback(() => setVisible((v) => !v), []);
  const show = useCallback(() => {
    if (!isMobile) setVisible(true);
  }, [isMobile]);
  const hide = useCallback(() => {
    if (!isMobile) setVisible(false);
  }, [isMobile]);

  return (
    <span ref={ref} className="relative inline">
      <span
        onClick={toggle}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="border-b border-dotted border-[var(--accent)]/50 text-[var(--accent)]/80 hover:text-[var(--accent)] cursor-help transition-colors"
      >
        {children || term}
      </span>

      {visible && !isMobile && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[calc(100vw-2rem)]">
          <span className="block bg-[var(--bg-surface)] border border-[var(--accent)]/20 rounded-xl px-3 py-2.5 text-xs leading-relaxed text-[var(--text-primary)] shadow-xl animate-tooltip-in">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
              {term}
            </span>
            {definition}
          </span>
        </span>
      )}

      {visible && isMobile && (
        <span
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setVisible(false)}
        >
          <span className="absolute inset-0 bg-black/50" />
          <span
            className="relative w-full bg-[var(--bg-surface)] border-t border-[var(--accent)]/20 rounded-t-2xl px-5 py-5 animate-slide-up block"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="block w-10 h-1 rounded-full bg-[var(--text-muted)] mx-auto mb-3" />
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
              {term}
            </span>
            <span className="block text-sm leading-relaxed text-[var(--text-primary)]">
              {definition}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
