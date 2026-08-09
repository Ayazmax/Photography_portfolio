import { useEffect, useLayoutEffect } from "react";

/**
 * GSAP setup must run before paint to avoid a flash of un-animated content,
 * but useLayoutEffect warns during SSR — fall back to useEffect on the server.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
