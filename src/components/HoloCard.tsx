"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
/** Small enough to compute in a couple of milliseconds, plenty of resolution for a smooth mask. */
const MASK_SAMPLE_WIDTH = 48;
/** Steepness of the light/dark separation below - higher pushes bright areas toward full effect
 *  and dark areas toward none even faster. See `gain()`. */
const MASK_CONTRAST = 3.4;

/**
 * Perlin's "gain" S-curve: fixed at 0 -> 0, 0.5 -> 0.5, and 1 -> 1, but bows away from the
 * straight diagonal line in between - the higher `k`, the more it saturates toward 0 or 1 well
 * before the input actually reaches the extremes. That's what makes light areas hit full effect
 * fast and dark areas fall to none fast, instead of a plain linear (and much gentler) ramp.
 */
function gain(x: number, k: number): number {
  return x < 0.5 ? 0.5 * Math.pow(2 * x, k) : 1 - 0.5 * Math.pow(2 * (1 - x), k);
}

/**
 * Reads the actual artwork's brightness and bakes it into a mask: a white image whose per-pixel
 * alpha is that pixel's contrast-boosted luminance. Used as a CSS mask-image on the shine layers
 * so darker parts of the illustration progressively suppress the holo/glare effect instead of
 * shining just as bright as the lightest parts - real foil cards mute the same way over dark ink.
 */
function computeLuminanceMask(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = MASK_SAMPLE_WIDTH;
        const h = Math.max(1, Math.round(w * (img.naturalHeight / (img.naturalWidth || 1)))) || w;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas context unavailable.");
        ctx.drawImage(img, 0, 0, w, h);
        const source = ctx.getImageData(0, 0, w, h);
        const out = ctx.createImageData(w, h);
        for (let i = 0; i < source.data.length; i += 4) {
          const luminance = 0.2126 * source.data[i] + 0.7152 * source.data[i + 1] + 0.0722 * source.data[i + 2];
          out.data[i] = 255;
          out.data[i + 1] = 255;
          out.data[i + 2] = 255;
          out.data[i + 3] = gain(luminance / 255, MASK_CONTRAST) * 255;
        }
        ctx.putImageData(out, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to build luminance mask."));
      }
    };
    img.onerror = () => reject(new Error("Image failed to load for luminance masking."));
    img.src = src;
  });
}

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
  const [maskUrl, setMaskUrl] = useState<string | null>(null);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Recomputed per image - cheap (a ~48px-wide canvas sample), and only runs once per src change,
  // never per frame. If it fails for any reason (e.g. a future non-data-URI src tainting the
  // canvas), maskUrl just stays null and the shine falls back to its old untinted behavior.
  useEffect(() => {
    let cancelled = false;
    computeLuminanceMask(src)
      .then((url) => {
        if (!cancelled) setMaskUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

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

  const maskStyle = maskUrl
    ? ({
        maskImage: `url(${maskUrl})`,
        WebkitMaskImage: `url(${maskUrl})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      } as React.CSSProperties)
    : undefined;

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
        <div className="holo-card-shine-mask" style={maskStyle}>
          <div ref={glareRef} className="holo-card-glare" />
          {holo && <div ref={foilRef} className="holo-card-foil" />}
        </div>
      </div>
    </div>
  );
}
