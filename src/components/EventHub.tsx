"use client";

import { useRouter } from "next/navigation";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import { eventBadge, getEvent, isEventLive, type EventTheme } from "@/lib/events";
import { useHydrated } from "@/lib/useHydrated";

type PlayMode = "solo" | "bot" | "friend";

const PLAY_MODES: { value: PlayMode; label: string; blurb: string; icon: "cards" | "bot" | "users" }[] = [
  { value: "solo", label: "Solo", blurb: "Open packs on your own", icon: "cards" },
  { value: "bot", label: "vs Bots", blurb: "1–9 CPU opponents", icon: "bot" },
  { value: "friend", label: "vs Friends", blurb: "Create a room to share", icon: "users" },
];

/**
 * An event's entry point, and the only question it asks: how do you want to play.
 *
 * It used to also pick the pack type and then need a Continue tap to act on both. But the
 * setup screen it hands off to asks for the pack type anyway, so that choice was being made
 * twice in a row under two different names - and a radio group whose only effect is to arm a
 * button is two taps for one decision. Each row now goes straight through, and the pack type
 * is settled in the one place that was always going to ask for it.
 */
export default function EventHub({ slug }: { slug: EventTheme }) {
  const router = useRouter();
  const event = getEvent(slug)!;
  const now = useHydrated();
  // Null until hydration, so a prerender built weeks ago is never the thing that
  // decides an event is over.
  const ended = now !== null && !isEventLive(event, now);
  const badge = eventBadge(event, now);

  function start(playMode: PlayMode) {
    const theme = `theme=${event.slug}`;
    // Solo opens on the classic pack; every setup screen lets you change it from there.
    if (playMode === "solo") router.push(`/solo/classic?${theme}`);
    else if (playMode === "bot") router.push(`/bot?${theme}`);
    else router.push(`/battle?${theme}&create=1`);
  }

  return (
    <Screen immersive back="/" title="Event">
      <div className="screen-pad flex flex-1 flex-col">
        {/* Event hero. The background image lives in public/modes/; until it
            exists the gradient underneath carries the banner on its own.
            Only the badge and title sit on the art - the longer blurb goes
            below it, where it stays readable over whatever the artwork does. */}
        <div
          className="enter-up relative overflow-hidden rounded-3xl"
          style={{
            backgroundImage: `url("${event.image}"), ${event.gradient}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="sheen-drift pointer-events-none absolute -inset-1/2 bg-gradient-to-tr from-transparent via-white/12 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgb(0 0 0 / 88%) 0%, rgb(0 0 0 / 62%) 30%, rgb(0 0 0 / 14%) 62%, transparent 100%)",
            }}
          />
          <div className="relative flex min-h-[13.5rem] flex-col justify-end p-5">
            {badge && (
              <span className="mb-2 self-start rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                {badge}
              </span>
            )}
            <h1
              className="font-display text-[2.15rem] font-extrabold leading-none tracking-tight text-white"
              style={{ textShadow: "0 2px 14px rgb(0 0 0 / 70%)" }}
            >
              {event.label}
            </h1>
          </div>
        </div>

        <p
          className="enter-up mt-4 text-[13.5px] leading-relaxed text-slate-400"
          style={{ "--d": "50ms" } as React.CSSProperties}
        >
          {ended
            ? "This event has finished, so it can't be played any more. Everything you pulled during it is still in your binder."
            : event.blurb}
        </p>

        {ended ? (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-ghost enter-up mt-6 w-full"
            style={{ "--d": "80ms" } as React.CSSProperties}
          >
            Back to packs
          </button>
        ) : (
          <div className="enter-up mt-7" style={{ "--d": "80ms" } as React.CSSProperties}>
            <p className="section-label mb-2.5">How do you want to play?</p>
            <div className="flex flex-col gap-2">
              {PLAY_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => start(m.value)}
                  className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-3.5 text-left transition-all duration-150 active:scale-[0.98]"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400">
                    <Icon name={m.icon} size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-bold text-white">{m.label}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{m.blurb}</p>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={18}
                    className="flex-shrink-0 text-slate-600 transition-transform duration-150 group-active:translate-x-0.5"
                  />
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
              Every pack type works inside the event — you&apos;ll pick one next. Only the artwork theme is
              fixed.
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
