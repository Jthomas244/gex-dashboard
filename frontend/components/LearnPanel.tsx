"use client";

import { useState, useEffect } from "react";
import { learnSections } from "@/lib/educational-content";
import GlossaryTerm from "./GlossaryTerm";

interface LearnPanelProps {
  open: boolean;
  onClose: () => void;
  onDismissPermanently: () => void;
}

// Parse content and wrap glossary terms
function renderContent(text: string) {
  const glossaryTerms = [
    "gamma exposure",
    "gamma",
    "delta",
    "open interest",
    "GEX",
    "market maker",
    "dealer",
    "flip point",
    "mean reversion",
    "mean-reversion",
    "momentum",
    "volatility compression",
    "volatility expansion",
    "0DTE",
    "pin risk",
    "call wall",
    "put wall",
  ];

  // Split text into paragraphs
  const paragraphs = text.split("\n\n");

  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split("\n");
    return (
      <div key={pIdx} className="mb-3 last:mb-0">
        {lines.map((line, lIdx) => {
          // Check for bullet points
          const isBullet = line.startsWith("- ") || line.startsWith("• ");
          const isHeader = line === line.toUpperCase() && line.length > 3 && !line.startsWith("-");
          const content = isBullet ? line.slice(2) : line;

          if (!content.trim()) return null;

          // Find and wrap glossary terms
          const parts = splitWithTerms(content, glossaryTerms);

          const rendered = (
            <span>
              {parts.map((part, i) => {
                const matchedTerm = glossaryTerms.find(
                  (t) => t.toLowerCase() === part.toLowerCase()
                );
                if (matchedTerm) {
                  return (
                    <GlossaryTerm key={i} term={matchedTerm}>
                      {part}
                    </GlossaryTerm>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </span>
          );

          if (isHeader) {
            return (
              <p key={lIdx} className="text-[var(--text-primary)] font-semibold text-xs uppercase tracking-wider mt-3 first:mt-0 mb-1">
                {rendered}
              </p>
            );
          }

          if (isBullet) {
            return (
              <div key={lIdx} className="flex gap-2 ml-1 mb-0.5">
                <span className="text-[var(--accent)] flex-shrink-0">•</span>
                <span>{rendered}</span>
              </div>
            );
          }

          return <p key={lIdx} className="mb-0.5">{rendered}</p>;
        })}
      </div>
    );
  });
}

// Split text while preserving glossary terms for wrapping
function splitWithTerms(text: string, terms: string[]): string[] {
  // Sort by length descending to match longest first
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  return text.split(regex).filter(Boolean);
}

export default function LearnPanel({
  open,
  onClose,
  onDismissPermanently,
}: LearnPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["what-is-gex"])
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Understanding GEX
        </h2>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-lg leading-none"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {learnSections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div
              key={section.id}
              className="border-l-2 border-[var(--accent)]/30 rounded-r-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {section.title}
                </span>
                <span
                  className={`text-[var(--text-muted)] transition-transform duration-200 text-xs ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-[var(--text-secondary)] animate-accordion-open">
                  {renderContent(section.content)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.06]">
        <button
          onClick={onDismissPermanently}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Close & Don't Show Again
        </button>
      </div>
    </>
  );

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg-primary)] animate-slide-up">
        {panelContent}
      </div>
    );
  }

  // Desktop: right sidebar
  return (
    <div className="fixed top-0 right-0 h-full w-[360px] z-40 bg-[var(--bg-primary)] border-l border-white/[0.06] flex flex-col shadow-2xl animate-slide-in-right">
      {panelContent}
    </div>
  );
}
