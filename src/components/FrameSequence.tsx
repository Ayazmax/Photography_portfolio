"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { loadSequence, nearestDrawable, onSequenceProgress } from "@/lib/frames";
import type { SequenceMeta } from "@/lib/media.generated";

/**
 * Marks the ancestor whose scroll range drives the playhead. Resolved by
 * `closest()` rather than a ref prop: React attaches a parent host element's
 * ref *after* its children's layout effects, so a ref would still be null here.
 */
export const SEQUENCE_HOST = "data-sequence-host";

type Props = {
  sequence: SequenceMeta;
  start?: string;
  end?: string;
  /** Load on mount (hero) instead of waiting until the section approaches. */
  eager?: boolean;
  className?: string;
  /**
   * Called on every scrub tick. Write straight to the DOM here — this fires
   * at frame rate, so setting React state would thrash.
   */
  onProgress?: (progress: number, frame: number, total: number) => void;
};

/** Upscaling a 1440px source past this just burns fill rate. */
const MAX_DPR = 1.5;

/**
 * Draws a numbered JPG sequence to a canvas, mapping scroll progress to a
 * frame index — the technique behind Apple-style "scroll is the timeline"
 * pages. Frames come from `public/frames/<name>/0001.jpg`.
 */
export default function FrameSequence({
  sequence,
  start = "top top",
  end = "bottom bottom",
  eager = false,
  className,
  onProgress,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Kept in a ref so a changing callback doesn't tear down the ScrollTrigger.
  const progressRef = useRef(onProgress);
  useIsomorphicLayoutEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.closest<HTMLElement>(`[${SEQUENCE_HOST}]`);
    if (!canvas || !host) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let images: HTMLImageElement[] | null = null;
    const playhead = { frame: 0 };

    const draw = () => {
      if (!images) return;
      const img = nearestDrawable(images, Math.round(playhead.frame));
      if (!img) return;

      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingQuality = "high";
      draw();
    };

    let unsubscribe: (() => void) | undefined;

    const begin = () => {
      if (images) return;
      images = loadSequence(sequence).images;
      // Repaint as frames stream in so the first view isn't blank.
      unsubscribe = onSequenceProgress(sequence, draw);
    };

    const ctxScope = gsap.context(() => {
      if (eager) begin();
      else {
        ScrollTrigger.create({
          trigger: host,
          start: "top bottom+=60%",
          once: true,
          onEnter: begin,
        });
      }

      gsap.to(playhead, {
        frame: sequence.frames - 1,
        ease: "none",
        snap: { frame: 1 },
        scrollTrigger: {
          trigger: host,
          start,
          end,
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          draw();
          const frame = Math.round(playhead.frame);
          progressRef.current?.(
            frame / (sequence.frames - 1),
            frame,
            sequence.frames
          );
        },
      });
    }, host);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      observer.disconnect();
      unsubscribe?.();
      ctxScope.revert();
    };
  }, [sequence, start, end, eager]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? "absolute inset-0 h-full w-full"}
    />
  );
}
