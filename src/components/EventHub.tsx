"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import Segmented from "@/components/ui/Segmented";
import { eventBadge, getEvent, isEventLive, type EventTheme } from "@/lib/events";
import { useHydrated } from "@/lib/useHydrated";
import type { PackMode } from "@/lib/types";

type PlayMode = "solo" | "bot" | "friend";

const PLAY_MODES: { value: PlayMode; label: string; blurb: string; icon: "cards" | "bot" | "users" }[] = [
  { value: "solo", label: "Solo", blurb: "Open packs on your own", icon: "cards" },
  { value: "bot", label: "vs Bots", blurb: "1–5 CPU opponents", icon: "bot" },
  { value: "friend", label: "vs Friends", blurb: "Create a room to share", icon: "users" },
];

const PACK_OPTIONS: { value: PackMode; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "sir", label: "Only SIRs" },
  { value: "tagteam", label: "Tag Teams" },
  { value: "tagteamsir", label: "Tag Team SIRs" },
  { value: "tripletagteamsir", label: "Triple Tag SIRs" },
];

/**
 * An event's entry point. Events are purely a coat of paint on the normal game,
 * so this screen deliberately gives away nothing: you still choose how to play
 * and which pack mode to run, then it hands off to the ordinary solo/bot/friend
 * setup with `?theme=` attached. Only the artwork direction changes.
 */
export default function EventHub({ slug }: { slug: EventTheme }) {
  const router = useRouter();
  const event = getEvent(slug)!;
  const now = useHydrated();
  // Null until hydration, so a prerender built weeks ago is never the thing that
  // decides an event is over - the setup only disappears once the browser confirms it.
  const ended = now !== null && !isEventLive(event, now);
  const badge = eventBadge(event, now);

  const [playMode, setPlayMode] = useState<PlayMode>("solo");
  const [packMode, setPackMode] = useState<PackMode>("classic");

  function start() {
    const theme = `theme=${event.slug}`;
    if (playMode === "solo") router.push(`/solo/${packMode}?${theme}`);
    else if (playMode === "bot") router.push(`/bot?${theme}&pack=${packMode}`);
    else router.push(`/battle?${theme}&pack=${packMode}&create=1`);
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

        {!ended && (
          <>
            <div className="enter-up mt-7" style={{ "--d": "80ms" } as React.CSSProperties}>
              <p className="section-label mb-2.5">How do you want to play?</p>
              <div className="flex flex-col gap-2">
                {PLAY_MODES.map((m) => {
                  const on = m.value === playMode;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPlayMode(m.value)}
                      aria-pressed={on}
                      className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-150 active:scale-[0.98] ${
                        on
                          ? "border-amber-300/45 bg-amber-400/[0.09]"
                          : "border-white/[0.09] bg-white/[0.035]"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          on ? "bg-amber-400/18 text-amber-300" : "bg-white/[0.06] text-slate-400"
                        }`}
                      >
                        <Icon name={m.icon} size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[14.5px] font-bold ${on ? "text-white" : "text-slate-300"}`}>{m.label}</p>
                        <p className="mt-0.5 text-[12px] text-slate-500">{m.blurb}</p>
                      </div>
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                          on ? "border-amber-300 bg-amber-300 text-[#2a1705]" : "border-white/15"
                        }`}
                      >
                        {on && <Icon name="check" size={11} strokeWidth={3.5} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="enter-up mt-6" style={{ "--d": "140ms" } as React.CSSProperties}>
              <Segmented
                label="Pack type"
                options={PACK_OPTIONS}
                value={packMode}
                onChange={setPackMode}
                columns={2}
                spanLast
                help="Every normal pack type works inside the event — only the artwork theme is fixed."
              />
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 z-20 mt-7">
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#07070c] to-transparent" />
        <div
          className="screen-pad relative bg-[#07070c]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.875rem)" }}
        >
          {ended ? (
            <button type="button" onClick={() => router.push("/")} className="btn-ghost w-full">
              Back to packs
            </button>
          ) : (
            <button type="button" onClick={start} className="btn-primary w-full">
              <Icon name="sparkles" size={17} />
              Continue
            </button>
          )}
        </div>
      </div>
    </Screen>
  );
}
