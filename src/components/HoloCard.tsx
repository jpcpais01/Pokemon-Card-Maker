"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string;
  alt: string;
  /** Full rainbow foil + prism + sparkle, reserved for the top rarity tier - every card still gets the tilt + glare + shadow. */
  holo?: boolean;
  /** Classes for the sizing/aspect-ratio box (e.g. "aspect-[3/4] w-full") - the card itself fills it. */
  className?: string;
  /** Classes for the card's own frame - border color, radius, shadow (e.g. "rounded-2xl border ..."). */
  frameClassName?: string;
}

const MAX_TILT_DEG = 15;
/** How fast the current pose eases toward the pointer's target pose each frame - lower is heavier/springier. */
const SPRING = 0.16;
const SETTLE_EPSILON = 0.0015;

/**
 * A card that tilts in real 3D toward wherever the pointer is (mouse hover on desktop, drag on
 * touch), with a holographic foil + prism + sparkle + glossy glare + contact shadow layered on
 * top whose *position* shifts with the angle - the classic foil-card look where different colors
 * shine at different angles. The pose is spring-eased every frame rather than snapped 1:1 or
 * handed to a CSS transition, so the card has real weight and settles instead of teleporting.
 *
 * Everything lives inside one mount-only effect using native DOM listeners and a self-contained
 * rAF loop (plain closures, no refs holding functions) - only `transform`/`opacity` are ever
 * touched per frame, matching the compositor-only approach `.holo-sheen` already uses elsewhere.
 */
export default function HoloCard({ src, alt, holo, className, frameClassName }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const prismRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { px: 0.5, py: 0.5, active: false };
    const current = { px: 0.5, py: 0.5 };
    let rafId: number | null = null;

    function render() {
      const { px, py } = current;
      const rx = (0.5 - py) * MAX_TILT_DEG * 2;
      const ry = (px - 0.5) * MAX_TILT_DEG * 2;
      const edge = Math.max(Math.abs(px - 0.5), Math.abs(py - 0.5)) * 2;

      if (card) {
        const scale = 1 + edge * 0.015;
        card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, 1)`;
      }
      if (glareRef.current) {
        glareRef.current.style.transform = `translate3d(${((px - 0.5) * 90).toFixed(1)}%, ${((py - 0.5) * 90).toFixed(1)}%, 0)`;
        glareRef.current.style.opacity = (edge * 0.55).toFixed(2);
      }
      if (foilRef.current) {
        foilRef.current.style.transform = `translate3d(${((px - 0.5) * 55).toFixed(1)}%, ${((py - 0.5) * 55).toFixed(1)}%, 0)`;
        foilRef.current.style.opacity = (0.32 + edge * 0.45).toFixed(2);
      }
      if (prismRef.current) {
        prismRef.current.style.transform = `translate3d(${((0.5 - px) * 80).toFixed(1)}%, ${((py - 0.5) * 65).toFixed(1)}%, 0) rotate(${((px - 0.5) * 8).toFixed(1)}deg)`;
        prismRef.current.style.opacity = (0.22 + edge * 0.4).toFixed(2);
      }
      if (sparkleRef.current) {
        sparkleRef.current.style.transform = `translate3d(${((px - 0.5) * 30).toFixed(1)}%, ${((py - 0.5) * 30).toFixed(1)}%, 0)`;
        sparkleRef.current.style.opacity = (0.25 + edge * 0.55).toFixed(2);
      }
      if (shadowRef.current) {
        shadowRef.current.style.transform = `translate3d(${((0.5 - px) * 26).toFixed(1)}%, ${((0.5 - py) * 14).toFixed(1)}%, 0)`;
      }
    }

    function loop() {
      current.px += (target.px - current.px) * SPRING;
      current.py += (target.py - current.py) * SPRING;
      render();

      const settled =
        Math.abs(target.px - current.px) < SETTLE_EPSILON && Math.abs(target.py - current.py) < SETTLE_EPSILON;
      if (target.active || !settled) {
        rafId = requestAnimationFrame(loop);
      } else {
        current.px = target.px;
        current.py = target.py;
        render();
        rafId = null;
      }
    }

    function startLoop() {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    }

    function handlePointer(e: PointerEvent) {
      if (reducedMotion || !card) return;
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      target.px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      target.py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      target.active = true;
      startLoop();
    }

    function reset() {
      target.px = 0.5;
      target.py = 0.5;
      target.active = false;
      startLoop();
    }

    card.addEventListener("pointermove", handlePointer);
    card.addEventListener("pointerdown", handlePointer);
    card.addEventListener("pointerleave", reset);
    card.addEventListener("pointerup", reset);
    card.addEventListener("pointercancel", reset);

    return () => {
      card.removeEventListener("pointermove", handlePointer);
      card.removeEventListener("pointerdown", handlePointer);
      card.removeEventListener("pointerleave", reset);
      card.removeEventListener("pointerup", reset);
      card.removeEventListener("pointercancel", reset);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={`holo-card-stage ${className ?? ""}`}>
      <div ref={shadowRef} className="holo-card-shadow" />
      <div ref={cardRef} className={`holo-card ${frameClassName ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="holo-card-img" />
        <div ref={glareRef} className="holo-card-glare" />
        {holo && <div ref={foilRef} className="holo-card-foil" />}
        {holo && <div ref={prismRef} className="holo-card-prism" />}
        {holo && <div ref={sparkleRef} className="holo-card-sparkle" />}
      </div>
    </div>
  );
}
