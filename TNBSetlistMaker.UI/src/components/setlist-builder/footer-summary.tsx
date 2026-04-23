import { BUCKETS } from "@/types/rating";
import { GoldProgress } from "./gold-progress";
import type { SubmitButtonState } from "./header";

interface FooterSummaryProps {
  counts: { must: number; maybe: number; skip: number; rated: number };
  total: number;
  pct: number;
  canSubmit: boolean;
  submitState: SubmitButtonState;
  onOpenTray: () => void;
  onSubmit: () => void;
  onRequestEdit: () => void;
}

export function FooterSummary({
  counts,
  total,
  pct,
  canSubmit,
  submitState,
  onOpenTray,
  onSubmit,
  onRequestEdit,
}: FooterSummaryProps) {
  function renderButton() {
    if (submitState === "submitted") {
      return (
        <button onClick={onRequestEdit} className="border hairline px-3 py-2 rounded-md text-sm text-bone/70">
          Request edit
        </button>
      );
    }
    if (submitState === "editRequested") {
      return (
        <button disabled className="border hairline px-3 py-2 rounded-md text-sm text-bone/30 cursor-not-allowed">
          Pending…
        </button>
      );
    }
    if (submitState === "editApproved") {
      return (
        <button onClick={onSubmit} className="chip-gold px-3 py-2 rounded-md text-sm font-medium">
          Submit changes
        </button>
      );
    }
    // idle
    return canSubmit ? (
      <button onClick={onSubmit} className="chip-gold px-3 py-2 rounded-md text-sm font-medium">
        Submit
      </button>
    ) : (
      <button onClick={onOpenTray} className="border hairline px-3 py-2 rounded-md text-sm text-bone/80">
        Review
      </button>
    );
  }

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
        {renderButton()}
      </div>
    </div>
  );
}
