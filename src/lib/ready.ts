"use client";

export const READY_EVENT = "site:ready";

let ready = false;

export const isReady = () => ready;

export function markReady() {
  if (ready) return;
  ready = true;
  window.dispatchEvent(new Event(READY_EVENT));
}

/**
 * Fires immediately if the preloader already cleared, so late-mounting
 * components don't wait for an event that has been and gone.
 */
export function onReady(fn: () => void) {
  if (ready) {
    fn();
    return () => {};
  }
  window.addEventListener(READY_EVENT, fn, { once: true });
  return () => window.removeEventListener(READY_EVENT, fn);
}
