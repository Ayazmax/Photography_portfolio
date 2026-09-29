"use client";

import { asset } from "./base";
import type { SequenceMeta } from "./media.generated";

export const framePath = (name: string, index: number) =>
  asset(`/frames/${name}/${String(index + 1).padStart(4, "0")}.jpg`);

/**
 * Desktop keeps plain <img> elements. Phones get ImageBitmaps: they are decoded
 * once up front, so drawImage never has to re-decode a JPEG mid-scroll (mobile
 * browsers evict decoded <img> data aggressively).
 */
export type Frame = HTMLImageElement | ImageBitmap;

type Entry = {
  images: Frame[];
  loaded: number;
  total: number;
  ready: Promise<Frame[]>;
  listeners: Set<(progress: number) => void>;
};

/**
 * Sequences are cached module-wide so the preloader and the canvas player
 * share one set of decoded bitmaps instead of fetching the frames twice.
 */
const registry = new Map<string, Entry>();

const isTouch = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/**
 * Every decoded 720p frame is ~3.7 MB of bitmap. Phones get every other frame;
 * `nearestDrawable` fills the gaps, and at phone sizes the skip is invisible.
 */
function frameIndices(frames: number, stride: number) {
  const out: number[] = [];
  for (let i = 0; i < frames; i += stride) out.push(i);
  if (out[out.length - 1] !== frames - 1) out.push(frames - 1);
  return out;
}

/**
 * A landscape frame covering a portrait screen only ever shows a centre
 * strip, so phones keep just that (plus slack for the URL bar) — roughly a
 * quarter of the pixels to decode, hold and draw.
 */
function cropFor(img: HTMLImageElement) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const view = window.innerWidth / Math.max(1, window.innerHeight);
  const sw = view < w / h ? Math.min(w, Math.round(h * view * 1.2)) : w;
  return { sx: Math.round((w - sw) / 2), sw, h };
}

function startLoading(
  entry: Entry,
  name: string,
  indices: number[],
  bitmaps: boolean
) {
  let next = 0;

  const loadOne = (index: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      if (!bitmaps) entry.images[index] = img;

      const settle = () => {
        entry.loaded += 1;
        const p = entry.loaded / entry.total;
        entry.listeners.forEach((fn) => fn(p));
        resolve();
      };

      img.onload = () => {
        if (bitmaps && typeof createImageBitmap === "function") {
          const { sx, sw, h } = cropFor(img);
          createImageBitmap(img, sx, 0, sw, h)
            .then((bmp) => {
              entry.images[index] = bmp;
            })
            .catch(() => {
              entry.images[index] = img;
            })
            .finally(settle);
          return;
        }
        if (bitmaps) entry.images[index] = img;
        // Decode off the main thread so the first paint doesn't stutter.
        if (typeof img.decode === "function") img.decode().then(settle, settle);
        else settle();
      };
      img.onerror = settle;
      img.src = framePath(name, index);
    });

  const worker = async () => {
    while (next < indices.length) await loadOne(indices[next++]);
  };

  const pool = bitmaps ? 4 : 8;
  return Promise.all(Array.from({ length: pool }, worker)).then(
    () => entry.images
  );
}

export function loadSequence(meta: SequenceMeta) {
  let entry = registry.get(meta.name);

  if (!entry) {
    const touch = isTouch();
    const indices = frameIndices(meta.frames, touch ? 2 : 1);
    const created: Entry = {
      images: new Array<Frame>(meta.frames),
      loaded: 0,
      total: indices.length,
      listeners: new Set(),
      ready: Promise.resolve([]),
    };
    created.ready = startLoading(created, meta.name, indices, touch);
    registry.set(meta.name, created);
    entry = created;
  }

  return entry;
}

export function sequenceProgress(meta: SequenceMeta) {
  const entry = registry.get(meta.name);
  return entry ? entry.loaded / entry.total : 0;
}

export function onSequenceProgress(
  meta: SequenceMeta,
  fn: (progress: number) => void
) {
  const entry = loadSequence(meta);
  entry.listeners.add(fn);
  fn(entry.loaded / entry.total);
  return () => {
    entry.listeners.delete(fn);
  };
}

export const frameSize = (f: Frame) =>
  f instanceof HTMLImageElement
    ? { width: f.naturalWidth, height: f.naturalHeight }
    : { width: f.width, height: f.height };

const isDrawable = (f: Frame | undefined): f is Frame =>
  !!f &&
  (f instanceof HTMLImageElement ? f.complete && f.naturalWidth > 0 : f.width > 0);

/**
 * Scrubbing can outrun the network, so fall back to the closest frame that has
 * actually decoded rather than flashing an empty canvas.
 */
export function nearestDrawable(images: Frame[], index: number) {
  if (isDrawable(images[index])) return images[index];

  for (let offset = 1; offset < images.length; offset += 1) {
    const before = images[index - offset];
    if (isDrawable(before)) return before;
    const after = images[index + offset];
    if (isDrawable(after)) return after;
  }

  return null;
}
