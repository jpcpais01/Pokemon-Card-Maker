"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Icon from "./Icon";
import TabBar from "./TabBar";

interface Props {
  children: ReactNode;
  /**
   * Immersive screens (pack reveal, result, an active battle round) own the
   * whole viewport: no tab bar, no bottom inset. Everything else is a "tab
   * screen" that scrolls above the persistent nav.
   */
  immersive?: boolean;
  /** Back affordance in the header. A string renders a Link, a function a button. */
  back?: string | (() => void);
  backLabel?: string;
  /** Small caps label centered in the header. */
  title?: string;
  /** Rendered at the header's trailing edge (e.g. a "Reveal all" action). */
  action?: ReactNode;
  /** Drop the header entirely (screens that draw their own hero). */
  bare?: boolean;
  /** Extra classes for the scrolling content column. */
  className?: string;
}

/**
 * The one layout wrapper every screen goes through. Owns safe-area insets,
 * the content gutter/max-width, the optional sticky header, and whether the
 * persistent tab bar is present - so no individual screen has to re-derive
 * "how much bottom padding clears the nav" or hand-roll its own back button.
 */
export default function Screen({
  children,
  immersive,
  back,
  backLabel,
  title,
  action,
  bare,
  className,
}: Props) {
  const showHeader = !bare && (back !== undefined || title !== undefined || action !== undefined);

  return (
    <div className="flex min-h-dvh flex-col">
      {showHeader && (
        <header className="pt-safe sticky top-0 z-30 pb-2">
          <div className="screen-pad flex h-11 items-center gap-2">
            <div className="flex min-w-0 flex-1 justify-start">
              {back !== undefined &&
                (typeof back === "string" ? (
                  <Link href={back} className="btn-quiet -ml-2 !px-2">
                    <Icon name="chevron-left" size={18} />
                    {backLabel && <span className="truncate">{backLabel}</span>}
                  </Link>
                ) : (
                  <button type="button" onClick={back} className="btn-quiet -ml-2 !px-2">
                    <Icon name="chevron-left" size={18} />
                    {backLabel && <span className="truncate">{backLabel}</span>}
                  </button>
                ))}
            </div>

            {title && (
              <p className="section-label shrink-0 text-center text-slate-300">{title}</p>
            )}

            <div className="flex min-w-0 flex-1 justify-end">{action}</div>
          </div>
        </header>
      )}

      <main
        className={`flex flex-1 flex-col ${showHeader ? "" : "pt-safe"} ${
          immersive ? "" : "pb-tabbar"
        } ${className ?? ""}`}
      >
        {children}
      </main>

      {!immersive && <TabBar />}
    </div>
  );
}
