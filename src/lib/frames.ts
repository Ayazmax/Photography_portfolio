"use client";

import { asset } from "./base";
import type { SequenceMeta } from "./media.generated";

export const framePath = (name: string, index: number) =>
  asset(`/frames/${name}/${String(index + 1).padStart(4, "0")}.jpg`);

type Entry = {
  images: HTMLImageElement[];
  loaded: number;
  total: number;
  ready: Promise<HTMLImageElement[]>;
  listeners: Set<(progress: number) => void>;
};

/**
 * Sequences are cached module-wide so the preloader and the canvas player
 * share one set of decoded bitmaps instead of fetching the frames twice.
 */
const registry = new Map<string, Entry>();

/** Frames load in order through a small pool so early frames arrive first. */
const POOL_SIZE = 8;

/**
 * Every decoded 720p frame is ~3.7 MB of bitmap. Phones get every other frame;
 * `nearestDrawable` fills the gaps, and at phone sizes the skip is invisible.
 */
const frameStride = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches
    ? 2
    : 1;

function frameIndices(frames: number) {
  const stride = frameStride();
  const out: number[] = [];
  for (let i = 0; i < frames; i += stride) out.push(i);
  if (out[out.length - 1] !== frames - 1) out.push(frames - 1);
  return out;
}

function startLoading(entry: Entry, name: string, indices: number[]) {
  let next = 0;

  const loadOne = (index: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      entry.images[index] = img;

      const settle = () => {
        entry.loaded += 1;
        const p = entry.loaded / entry.total;
        entry.listeners.forEach((fn) => fn(p));
        resolve();
      };

      img.onload = () => {
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

  return Promise.all(Array.from({ length: POOL_SIZE }, worker)).then(
    () => entry.images
  );
}

export function loadSequence(meta: SequenceMeta) {
  let entry = registry.get(meta.name);

  if (!entry) {
    const indices = frameIndices(meta.frames);
    const created: Entry = {
      images: new Array<HTMLImageElement>(meta.frames),
      loaded: 0,
      total: indices.length,
      listeners: new Set(),
      ready: Promise.resolve([]),
    };
    created.ready = startLoading(created, meta.name, indices);
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

const isDrawable = (img: HTMLImageElement | undefined): img is HTMLImageElement =>
  !!img && img.complete && img.naturalWidth > 0;

/**
 * Scrubbing can outrun the network, so fall back to the closest frame that has
 * actually decoded rather than flashing an empty canvas.
 */
export function nearestDrawable(images: HTMLImageElement[], index: number) {
  if (isDrawable(images[index])) return images[index];

  for (let offset = 1; offset < images.length; offset += 1) {
    const before = images[index - offset];
    if (isDrawable(before)) return before;
    const after = images[index + offset];
    if (isDrawable(after)) return after;
  }

  return null;
}
