"use client";

/**
 * Warms a fixed list of image URLs and reports progress, so the preloader can
 * hold the curtain until the hero's first composition can actually paint.
 *
 * The hero renders these same URLs through a plain <img>, not the Next image
 * optimiser, so the bytes fetched here are the bytes it ends up using.
 */

type Batch = {
  loaded: number;
  total: number;
  ready: Promise<void>;
  listeners: Set<(progress: number) => void>;
};

const batches = new Map<string, Batch>();

export function loadImages(key: string, urls: readonly string[]): Batch {
  const existing = batches.get(key);
  if (existing) return existing;

  const batch: Batch = {
    loaded: 0,
    total: urls.length,
    listeners: new Set(),
    ready: Promise.resolve(),
  };

  const one = (url: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";

      const settle = () => {
        batch.loaded += 1;
        const progress = batch.total ? batch.loaded / batch.total : 1;
        batch.listeners.forEach((fn) => fn(progress));
        resolve();
      };

      img.onload = () => {
        // Decode up front so the first composed frame doesn't stutter.
        if (typeof img.decode === "function") img.decode().then(settle, settle);
        else settle();
      };
      img.onerror = settle;
      img.src = url;
    });

  batch.ready = Promise.all(urls.map(one)).then(() => undefined);
  batches.set(key, batch);
  return batch;
}

export function onImagesProgress(
  key: string,
  urls: readonly string[],
  fn: (progress: number) => void
) {
  const batch = loadImages(key, urls);
  batch.listeners.add(fn);
  fn(batch.total ? batch.loaded / batch.total : 1);
  return () => {
    batch.listeners.delete(fn);
  };
}
