import { BUCKETS } from "@/types/rating";
import { GoldProgress } from "./gold-progress";

interface FooterSummaryProps {
  counts: { must: number; maybe: number; skip: number; rated: number };
  total: number;
  pct: number;
  allRated: boolean;
  onOpenTray: () => void;
  onSubmit: () => void;
}

export function FooterSummary({ counts, total, pct, allRated, onOpenTray, onSubmit }: FooterSummaryProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-10 border-t hairline bg-tar/90 backdrop-blur sm:hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex gap-3 text-[11px] mb-1">
            {BUCKETS.map((b) => (
              <span key={b.id} className="flex items-center gap-1" style={{ color: b.accent }}>
                <span aria-hidden>{b.glyph}</span>
                <span className="font-mono tabular-nums">{counts[b.id!]}</span>
              </span>
            ))}
            <span className="ml-auto font-mono tabular-nums text-bone/45">
              {counts.rated}/{total}
            </span>
          </div>
          <GoldProgress value={pct} />
        </div>
        {allRated ? (
          <button onClick={onSubmit} className="chip-gold px-3 py-2 rounded-md text-sm font-medium">
            Submit
          </button>
        ) : (
          <button onClick={onOpenTray} className="border hairline px-3 py-2 rounded-md text-sm text-bone/80">
            Review
          </button>
        )}
      </div>
    </div>
  );
}
