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

/** Edges need far more resolution than the smooth luminance mask - this is fine linework, not
 *  a broad gradient. Still only ~140k pixels, computed once per image. */
const ETCH_SAMPLE_WIDTH = 320;
/** Share of the card left carrying relief. Roughly what a real etched card has, and the reason
 *  the cutoff below is derived per image rather than fixed: with one fixed threshold a soft
 *  painterly illustration etched about 13% of its surface while a busy line-heavy one blew past
 *  50% and washed the art out. The *amount* of texture should be a property of the card, not of
 *  how much contrast the artwork happens to have. */
const ETCH_TARGET_COVERAGE = 0.14;
/** Edge strength at which relief reaches full depth, as a multiple of the per-image cutoff. */
const ETCH_FULL_DEPTH = 2.4;
/** Spacing of the milling lines cut across the ridges, in mask pixels. */
const ETCH_HATCH_PITCH = 3.2;
/** How far the lit and shadowed copies of the relief pull apart at full tilt, in CSS px.
 *  Below about 3 they overlap enough to cancel each other out and the relief never appears. */
const ETCH_SHIFT_PX = 3.2;

/** Smoothstep - eases in and out of the threshold instead of clipping edges to a hard on/off. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Builds the etched-foil relief map: a white image whose alpha is "how much ridge is here".
 *
 * Real Special Illustration Rares aren't foiled flat - the foil is embossed, and the embossing
 * follows the illustration's own linework, so every card's texture is unique to its art. So the
 * ridges come from a Sobel edge pass over the artwork rather than from any fixed pattern, which
 * means this is the one part of the shine that can't be a static asset.
 *
 * The fine diagonal hatch multiplied over the top is what stops it reading as a glowing outline:
 * real embossing is milled in lines, so the ridges are themselves finely striped.
 */
function computeEtchMask(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = ETCH_SAMPLE_WIDTH;
        const h = Math.max(1, Math.round(w * (img.naturalHeight / (img.naturalWidth || 1)))) || w;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas context unavailable.");
        ctx.drawImage(img, 0, 0, w, h);

        const pixels = ctx.getImageData(0, 0, w, h).data;
        const grey = new Float32Array(w * h);
        for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
          grey[p] = (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
        }

        const mags = new Float32Array(w * h);
        const HIST_BINS = 256;
        const HIST_MAX = 4;
        const hist = new Uint32Array(HIST_BINS);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const up = (y - 1) * w + x;
            const mid = y * w + x;
            const down = (y + 1) * w + x;
            const gx =
              grey[up + 1] + 2 * grey[mid + 1] + grey[down + 1] - (grey[up - 1] + 2 * grey[mid - 1] + grey[down - 1]);
            const gy =
              grey[down - 1] + 2 * grey[down] + grey[down + 1] - (grey[up - 1] + 2 * grey[up] + grey[up + 1]);
            const mag = Math.sqrt(gx * gx + gy * gy);
            mags[mid] = mag;
            hist[Math.min(HIST_BINS - 1, Math.floor((mag / HIST_MAX) * HIST_BINS))]++;
          }
        }

        // Walk the histogram down from the strongest edges until enough of the card is covered:
        // that magnitude becomes this image's floor, so every card ends up equally etched.
        const total = (w - 2) * (h - 2);
        const wanted = total * ETCH_TARGET_COVERAGE;
        let seen = 0;
        let cutBin = 0;
        for (let bin = HIST_BINS - 1; bin >= 0; bin--) {
          seen += hist[bin];
          if (seen >= wanted) {
            cutBin = bin;
            break;
          }
        }
        const cut = Math.max(0.05, (cutBin / HIST_BINS) * HIST_MAX);

        const depth = new Float32Array(w * h);
        for (let p = 0; p < w * h; p++) {
          depth[p] = smoothstep(cut, cut * ETCH_FULL_DEPTH, mags[p]);
        }

        // Round the ridges off with a small separable blur. A hard-edged mask makes the lit and
        // shadowed copies read as two separate outlines - like a misprint - once the tilt pulls
        // them apart; softening the profile turns that same offset into shading across one raised
        // edge, which is what a rounded emboss actually does to light.
        const blurred = new Float32Array(w * h);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const l = depth[y * w + Math.max(0, x - 1)];
            const c = depth[y * w + x];
            const r = depth[y * w + Math.min(w - 1, x + 1)];
            blurred[y * w + x] = (l + 2 * c + r) / 4;
          }
        }
        for (let x = 0; x < w; x++) {
          for (let y = 0; y < h; y++) {
            const u = blurred[Math.max(0, y - 1) * w + x];
            const c = blurred[y * w + x];
            const d = blurred[Math.min(h - 1, y + 1) * w + x];
            depth[y * w + x] = (u + 2 * c + d) / 4;
          }
        }

        const out = ctx.createImageData(w, h);
        for (let p = 0; p < w * h; p++) {
          const x = p % w;
          const y = (p / w) | 0;
          const hatch = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(((x + y) / ETCH_HATCH_PITCH) * Math.PI * 2));
          const o = p * 4;
          out.data[o] = 255;
          out.data[o + 1] = 255;
          out.data[o + 2] = 255;
          out.data[o + 3] = depth[p] * hatch * 255;
        }
        ctx.putImageData(out, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to build etch mask."));
      }
    };
    img.onerror = () => reject(new Error("Image failed to load for etch mapping."));
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
  const etchLightRef = useRef<HTMLDivElement>(null);
  const etchDarkRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [etchUrl, setEtchUrl] = useState<string | null>(null);

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

  // Only the top tier is etched, so non-SIR cards never pay for the Sobel pass at all.
  useEffect(() => {
    if (!holo) return;
    let cancelled = false;
    computeEtchMask(src)
      .then((url) => {
        if (!cancelled) setEtchUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src, holo]);

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
        foilRef.current.style.transform = `translate3d(${((px - 0.5) * 72).toFixed(1)}%, ${((py - 0.5) * 72).toFixed(1)}%, 0)`;
        // Lower ceiling than the old color-dodge foil needed: hard-light acts on
        // the art's own colours, so it reads far stronger at the same opacity.
        foilRef.current.style.opacity = (0.38 + edge * 0.34).toFixed(2);
      }
      if (glareRef.current) {
        glareRef.current.style.transform = `translate3d(${((px - 0.5) * 90).toFixed(1)}%, ${((py - 0.5) * 90).toFixed(1)}%, 0)`;
        glareRef.current.style.opacity = (0.6 + edge * 0.35).toFixed(2);
      }
      // The relief is one map drawn twice, lit and shadowed, pulled apart along the tilt. Held
      // together they cancel, which is why a card lying flat looks unetched and the texture only
      // appears once you angle it - the same reason you have to tilt the real thing to see it.
      const shiftX = (px - 0.5) * 2 * ETCH_SHIFT_PX;
      const shiftY = (py - 0.5) * 2 * ETCH_SHIFT_PX;
      const etchOpacity = (edge * 0.75).toFixed(2);
      if (etchLightRef.current) {
        etchLightRef.current.style.transform = `translate3d(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px, 0)`;
        etchLightRef.current.style.opacity = etchOpacity;
      }
      if (etchDarkRef.current) {
        etchDarkRef.current.style.transform = `translate3d(${(-shiftX).toFixed(2)}px, ${(-shiftY).toFixed(2)}px, 0)`;
        etchDarkRef.current.style.opacity = etchOpacity;
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
    if (etchLightRef.current) etchLightRef.current.style.opacity = "0";
    if (etchDarkRef.current) etchDarkRef.current.style.opacity = "0";
  }, []);

  const etchStyle = etchUrl
    ? ({
        maskImage: `url(${etchUrl})`,
        WebkitMaskImage: `url(${etchUrl})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      } as React.CSSProperties)
    : undefined;

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
        {/* Deliberately outside the luminance mask above: that one dims the shine over dark ink,
            which is right for a reflection but wrong for embossing - a ridge is physically there
            whatever colour was printed on it, and on real cards the relief shows up most against
            dark areas. Last in the stack because it's the surface of the card. */}
        {holo && etchUrl && (
          <>
            <div ref={etchDarkRef} className="holo-card-etch holo-card-etch-dark" style={etchStyle} />
            <div ref={etchLightRef} className="holo-card-etch holo-card-etch-light" style={etchStyle} />
          </>
        )}
      </div>
    </div>
  );
}
