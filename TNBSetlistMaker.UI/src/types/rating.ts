export type SongRating = "must" | "maybe" | "skip" | null;

export interface Bucket {
  id: SongRating;
  label: string;
  short: string;
  verb: string;
  accent: string;
  glyph: string;
  hotkey: string;
}

export const BUCKETS: Bucket[] = [
  { id: "must", label: "Must", short: "Must", verb: "Must", accent: "#7e9a6a", glyph: "\u2736", hotkey: "1" },
  { id: "maybe", label: "Maybe", short: "Maybe", verb: "Maybe", accent: "#d69a44", glyph: "\u25d0", hotkey: "2" },
  { id: "skip", label: "Skip", short: "Skip", verb: "Don't play", accent: "#b85c4a", glyph: "\u2715", hotkey: "3" },
];

export const BUCKET_BY_ID = Object.fromEntries(BUCKETS.map((b) => [b.id, b])) as Record<
  NonNullable<SongRating>,
  Bucket
>;
