import { BUCKET_BY_ID, type SongRating } from "@/types/rating";

interface BucketPillProps {
  bucket: SongRating;
  size?: "sm" | "md";
}

export function BucketPill({ bucket, size = "sm" }: BucketPillProps) {
  if (!bucket) return null;
  const b = BUCKET_BY_ID[bucket];
  if (!b) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } font-medium tracking-wide`}
      style={{
        background: `${b.accent}20`,
        color: b.accent,
        boxShadow: `inset 0 0 0 1px ${b.accent}55`,
      }}
    >
      <span aria-hidden>{b.glyph}</span>
      {b.short}
    </span>
  );
}
