export const SITE = {
  name: "Odessa Vane",
  first: "Odessa",
  last: "Vane",
  role: "Weddings · Parties · People",
  tagline: "Colour, at full volume",
  email: "hello@odessavane.com",
  phone: "+351 912 004 118",
  bases: ["Lisbon", "Mexico City"],
  since: 2014,
} as const;

export const NAV = [
  { label: "Index", href: "#index" },
  { label: "Work", href: "#works" },
  { label: "Studio", href: "#studio" },
  { label: "Contact", href: "#contact" },
] as const;

export type Work = {
  no: string;
  title: string;
  place: string;
  year: string;
  medium: string;
  slug: string;
  /** Tailwind text colour token used for this entry's accents. */
  accent: string;
};

export const WORKS: Work[] = [
  {
    no: "01",
    title: "Confetti Hour",
    place: "Puglia, Italy",
    year: "2025",
    medium: "Wedding",
    slug: "work-01",
    accent: "text-punch",
  },
  {
    no: "02",
    title: "Rooftop, 2 A.M.",
    place: "Mexico City",
    year: "2025",
    medium: "Party",
    slug: "work-02",
    accent: "text-orchid",
  },
  {
    no: "03",
    title: "The Getting Ready",
    place: "Comporta, Portugal",
    year: "2025",
    medium: "Wedding",
    slug: "work-03",
    accent: "text-lagoon",
  },
  {
    no: "04",
    title: "Sparklers & Spritz",
    place: "Lisbon, Portugal",
    year: "2024",
    medium: "Birthday",
    slug: "work-04",
    accent: "text-sun",
  },
  {
    no: "05",
    title: "Yellow in Provence",
    place: "Valensole, France",
    year: "2024",
    medium: "Environmental portrait",
    slug: "work-05",
    accent: "text-electric",
  },
  {
    no: "06",
    title: "Last Dance",
    place: "Ronda, Spain",
    year: "2025",
    medium: "Wedding",
    slug: "work-06",
    accent: "text-sun",
  },
  {
    no: "07",
    title: "Colour Field",
    place: "Lisbon, Portugal",
    year: "2024",
    medium: "Street",
    slug: "work-07",
    accent: "text-punch",
  },
];

export const STATS = [
  { value: 12, suffix: "", label: "Years behind the lens" },
  { value: 218, suffix: "", label: "Weddings & parties shot" },
  { value: 34, suffix: "", label: "Countries danced in" },
  { value: 48, suffix: "h", label: "Average gallery turnaround" },
] as const;

export const PRESS = [
  "Vogue Weddings",
  "Junebug Weddings",
  "Rangefinder",
  "Condé Nast Traveller",
  "Green Wedding Shoes",
  "Hypebeast",
] as const;

export const SERVICES = [
  {
    no: "I",
    title: "Weddings",
    body: "Full-day documentary coverage, first coffee to last song. No stiff line-ups, no shot list you didn't write. Two shooters, unlimited frames, gallery back in forty-eight hours.",
    accent: "text-punch",
  },
  {
    no: "II",
    title: "Parties & Events",
    body: "Launches, birthdays, festivals, club nights. Direct flash, fast glass, and someone who knows when to disappear and when to get in the middle of it.",
    accent: "text-orchid",
  },
  {
    no: "III",
    title: "Portraits on Location",
    body: "Environmental portraiture shot somewhere that actually means something — a lavender field, a painted wall, your kitchen at seven in the morning.",
    accent: "text-lagoon",
  },
] as const;
