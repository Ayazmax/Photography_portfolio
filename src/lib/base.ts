/**
 * GitHub Pages serves this project at /Photography_portfolio, not root.
 * `NEXT_PUBLIC_BASE_PATH` is set only for the Pages build; `next dev` stays
 * at `/` so local images keep working.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
