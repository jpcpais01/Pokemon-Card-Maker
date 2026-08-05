"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";

interface Tab {
  href: string;
  label: string;
  icon: IconName;
  /** Any route starting with one of these also lights this tab up. */
  match: string[];
}

const TABS: Tab[] = [
  { href: "/", label: "Packs", icon: "cards", match: ["/solo"] },
  { href: "/battle", label: "Battle", icon: "swords", match: ["/battle", "/bot"] },
  { href: "/gallery", label: "Binder", icon: "binder", match: ["/gallery"] },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (pathname === tab.href) return true;
  return tab.match.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Persistent bottom navigation - the single strongest "this is an app, not a
 * page" signal, and it maps directly onto what the app actually does: open
 * packs, battle, browse your collection.
 *
 * Deliberately not rendered on immersive flow screens (reveal, result, an
 * active battle round); those own the whole viewport and `Screen` opts out via
 * `immersive`, so the bar never competes with a card you're looking at.
 */
export default function TabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[var(--tabbar-h)] max-w-md items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="group relative flex flex-1 flex-col items-center justify-center gap-1 pt-1"
            >
              {/* Active pill sits behind the icon so the transition reads as the
                  indicator sliding between tabs rather than the icon jumping. */}
              <span
                className={`absolute top-2 h-9 w-14 rounded-full transition-all duration-300 ${
                  active ? "scale-100 bg-amber-300/12 opacity-100" : "scale-75 opacity-0"
                }`}
              />
              <Icon
                name={tab.icon}
                size={22}
                className={`relative transition-all duration-200 ${
                  active ? "scale-105 text-amber-300" : "text-slate-500 group-active:text-slate-300"
                }`}
              />
              <span
                className={`relative text-[10px] font-bold tracking-wide transition-colors duration-200 ${
                  active ? "text-amber-300" : "text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
