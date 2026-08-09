import { SCENES } from "@/lib/layers.generated";
import { SITE } from "@/lib/site";

/**
 * The hero's scroll beats. Each one pairs a background plate with a keyed
 * foreground cutout; the two slide in from opposite sides and lock together
 * into a single composition at the middle of the beat.
 */
type Beat = {
  slug: string;
  kicker: string;
  /** Set on the opening beat so it carries the wordmark instead of a title. */
  wordmark?: true;
  title: string;
  place: string;
  year: number;
  /** Wash laid over the plate, and the accent used by that beat's type. */
  tint: string;
};

const BEATS: readonly Beat[] = [
  {
    slug: "first-look",
    kicker: "Weddings",
    wordmark: true,
    title: `${SITE.first} ${SITE.last}`,
    place: "Ronda, Spain",
    year: 2025,
    tint: "#ff9d2f",
  },
  {
    slug: "rooftop",
    kicker: "Parties",
    title: "Rooftop, 2 A.M.",
    place: "Mexico City",
    year: 2025,
    tint: "#e93cc4",
  },
  {
    slug: "field",
    kicker: "Festivals",
    title: "Field & Fireworks",
    place: "Somerset, UK",
    year: 2025,
    tint: "#ff3b2f",
  },
  {
    slug: "colour",
    kicker: "On location",
    title: "Colour Field",
    place: "Lisbon, Portugal",
    year: 2024,
    tint: "#3550ff",
  },
];

export const HERO_SCENES = BEATS.map((beat) => {
  const layers = SCENES.find((scene) => scene.slug === beat.slug) ?? SCENES[0];
  return { ...beat, cast: layers.cast, plate: layers.plate };
});

/** Everything the opening composition needs on screen before we lift the curtain. */
export const HERO_IMAGES = HERO_SCENES.flatMap((scene) => [
  scene.plate.src,
  scene.cast.src,
]);
