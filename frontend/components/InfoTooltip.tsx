"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface InfoTooltipProps {
  content: string;
  /** Position relative to the icon */
  position?: "top" | "bottom" | "left" | "right";
  /** Size of the ? icon */
  size?: "sm" | "md";
  /** Additional className for the wrapper */
  className?: string;
}

export default function InfoTooltip({
  content,
  position = "top",
  size = "sm",
  className = "",
}: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!visible || !isMobile) return;
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
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

  const sizeClasses =
    size === "sm" ? "w-3.5 h-3.5 text-[9px]" : "w-4 h-4 text-[10px]";

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        ref={iconRef}
        type="button"
        onClick={toggle}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={`${sizeClasses} rounded-full border border-[var(--text-muted)]/40 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/60 transition-colors flex items-center justify-center flex-shrink-0 cursor-help`}
        aria-label="More info"
      >
        ?
      </button>

      {/* Desktop tooltip */}
      {visible && !isMobile && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} w-72 max-w-[calc(100vw-2rem)]`}
        >
          <div className="bg-[var(--bg-elevated)] border border-white/10 rounded-xl px-3 py-2.5 text-xs leading-relaxed text-[var(--text-primary)] shadow-xl animate-tooltip-in">
            {content}
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {visible && isMobile && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setVisible(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            ref={tooltipRef}
            className="relative w-full bg-[var(--bg-elevated)] border-t border-white/10 rounded-t-2xl px-5 py-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">{content}</p>
            <button
              onClick={() => setVisible(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
