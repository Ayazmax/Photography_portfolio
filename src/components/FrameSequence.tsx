"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, isTouchDevice } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import {
  frameSize,
  loadSequence,
  nearestDrawable,
  onSequenceProgress,
  type Frame,
} from "@/lib/frames";
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
/** Phone crops are ~720px tall, so a 1× canvas already matches the source. */
const MAX_DPR_TOUCH = 1;

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

    const touch = isTouchDevice();
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const quality: ImageSmoothingQuality = touch ? "low" : "high";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = quality;

    let images: Frame[] | null = null;
    let drawn: Frame | null = null;
    const playhead = { frame: 0 };

    // `force` repaints after a resize wipes the canvas; otherwise skip scrub
    // ticks that land on the frame already showing.
    const draw = (force = false) => {
      if (!images) return;
      const img = nearestDrawable(images, Math.round(playhead.frame));
      if (!img || (!force && img === drawn)) return;
      drawn = img;

      const { width: iw, height: ih } = frameSize(img);
      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / iw, ch / ih);
      const w = iw * scale;
      const h = ih * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const resize = () => {
      const cap = touch ? MAX_DPR_TOUCH : MAX_DPR;
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingQuality = quality;
      draw(true);
    };

    let unsubscribe: (() => void) | undefined;

    const begin = () => {
      if (images) return;
      images = loadSequence(sequence).images;
      // Repaint as frames stream in so the first view isn't blank.
      unsubscribe = onSequenceProgress(sequence, () => draw());
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
          scrub: touch ? true : 0.45,
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
