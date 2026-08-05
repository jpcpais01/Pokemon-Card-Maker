"use client";

import { useCallback, useEffect, useRef } from "react";

interface Props {
  src: string;
  alt: string;
  /** Full rainbow color-shift foil, reserved for the top rarity tier - every card still gets the tilt + glare. */
  holo?: boolean;
  /** Classes for the sizing/aspect-ratio box (e.g. "aspect-[3/4] w-full") - the card itself fills it. */
  className?: string;
  /** Classes for the card's own frame - border color, radius, shadow (e.g. "rounded-2xl border ..."). */
  frameClassName?: string;
}

const MAX_TILT_DEG = 16;

/**
 * A card that tilts in real 3D toward wherever the pointer is (mouse hover on desktop, drag on
 * touch), with a holographic foil + glossy glare layered on top whose *position* shifts with the
 * angle - the classic "different colors shine at different angles" foil-card look. See the
 * `.holo-card*` utilities in globals.css for why only transform/opacity are ever touched per frame.
 */
export default function HoloCard({ src, alt, holo, className, frameClassName }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const track = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    if (reducedMotionRef.current || rect.width === 0 || rect.height === 0) return;
    const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const rx = (0.5 - py) * MAX_TILT_DEG * 2;
    const ry = (px - 0.5) * MAX_TILT_DEG * 2;
    const edge = Math.max(Math.abs(px - 0.5), Math.abs(py - 0.5)) * 2;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (card) {
        card.style.transition = "none";
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
      }
      if (foilRef.current) {
        foilRef.current.style.transform = `translate3d(${((px - 0.5) * 55).toFixed(1)}%, ${((py - 0.5) * 55).toFixed(1)}%, 0)`;
        foilRef.current.style.opacity = (0.35 + edge * 0.4).toFixed(2);
      }
      if (glareRef.current) {
        glareRef.current.style.transform = `translate3d(${((px - 0.5) * 90).toFixed(1)}%, ${((py - 0.5) * 90).toFixed(1)}%, 0)`;
        glareRef.current.style.opacity = (0.5 + edge * 0.2).toFixed(2);
      }
    });
  }, []);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      track(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    },
    [track]
  );

  const reset = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const card = cardRef.current;
    if (card) {
      card.style.transition = "";
      card.style.transform = "";
    }
    if (foilRef.current) foilRef.current.style.opacity = "0";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  }, []);

  return (
    <div className={`holo-card-stage ${className ?? ""}`}>
      <div
        ref={cardRef}
        className={`holo-card ${frameClassName ?? ""}`}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={reset}
        onPointerUp={reset}
        onPointerCancel={reset}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="holo-card-img" />
        <div ref={glareRef} className="holo-card-glare" />
        {holo && <div ref={foilRef} className="holo-card-foil" />}
      </div>
    </div>
  );
}
