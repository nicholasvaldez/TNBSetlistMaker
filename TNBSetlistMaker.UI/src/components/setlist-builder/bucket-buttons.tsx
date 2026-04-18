import { BUCKETS, type SongRating } from "@/types/rating";

interface BucketButtonsProps {
  value: SongRating;
  onPick: (bucket: SongRating) => void;
  size?: "md" | "lg";
}

export function BucketButtons({ value, onPick, size = "md" }: BucketButtonsProps) {
  const isLg = size === "lg";

  return (
    <div className={`grid grid-cols-3 gap-2 ${isLg ? "sm:gap-3" : ""}`}>
      {BUCKETS.map((b) => {
        const active = value === b.id;
        return (
          <button
            key={b.id}
            onClick={() => onPick(active ? null : b.id)}
            className={`btn-bucket relative rounded-xl border hairline ${
              isLg ? "py-3 sm:py-4" : "py-2"
            } group`}
            style={{
              background: active ? b.accent : "rgba(20,18,17,0.6)",
              borderColor: active ? b.accent : undefined,
              color: active ? "#141211" : "#f1ead8",
              boxShadow: active
                ? `0 8px 24px -10px ${b.accent}80, inset 0 1px 0 rgba(255,255,255,0.25)`
                : "inset 0 1px 0 rgba(227,199,122,0.08)",
            }}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div
                className={`flex items-center gap-1.5 ${
                  isLg ? "text-base sm:text-lg" : "text-sm"
                } font-display tracking-wide`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {b.glyph}
                </span>
                <span className="font-medium">{b.label}</span>
              </div>
              <div className="stamp" style={{ color: active ? "rgba(20,18,17,0.7)" : undefined }}>
                press {b.hotkey}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
