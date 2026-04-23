import { LogoMark } from "./logo-mark";
import { GoldProgress } from "./gold-progress";

export type SubmitButtonState = "idle" | "submitted" | "editRequested" | "editApproved";

interface HeaderProps {
  pct: number;
  counts: { must: number; maybe: number; skip: number; rated: number };
  total: number;
  canSubmit: boolean;
  submitState: SubmitButtonState;
  onSubmit: () => void;
  onRequestEdit: () => void;
  onOpenTray: () => void;
}

export function Header({
  pct,
  counts,
  total,
  canSubmit,
  submitState,
  onSubmit,
  onRequestEdit,
  onOpenTray,
}: HeaderProps) {
  function renderSubmitButton() {
    if (submitState === "submitted") {
      return (
        <button
          onClick={onRequestEdit}
          className="rounded-md px-3 sm:px-4 py-2 font-medium text-sm border hairline text-bone/70 hover:text-bone hover:bg-bone/5"
        >
          Request edit
        </button>
      );
    }
    if (submitState === "editRequested") {
      return (
        <button
          disabled
          className="rounded-md px-3 sm:px-4 py-2 font-medium text-sm border hairline text-bone/30 cursor-not-allowed"
        >
          Edit requested…
        </button>
      );
    }
    if (submitState === "editApproved") {
      return (
        <button onClick={onSubmit} className="chip-gold rounded-md px-3 sm:px-4 py-2 font-medium text-sm">
          Submit changes
        </button>
      );
    }
    // idle
    return (
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`rounded-md px-3 sm:px-4 py-2 font-medium text-sm ${
          canSubmit ? "chip-gold" : "border hairline text-bone/35 cursor-not-allowed"
        }`}
      >
        Submit to band
      </button>
    );
  }
  return (
    <header className="border-b hairline sticky top-0 z-20 backdrop-blur bg-tar/80">
      <div className="max-w-350 mx-auto px-4 sm:px-6 flex items-center gap-3 sm:gap-4">
        <LogoMark size={110} />
        <div className="flex-1 min-w-0">
          <div className="stamp leading-none">The Nashville Band</div>
          <h1 className="font-display text-xl sm:text-2xl text-bone leading-tight">
            Set the Night — <span className="italic text-goldlight">Song Curator</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-3 min-w-55">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-bone/55 mb-1">
              <span className="stamp">
                {counts.rated} / {total} rated
              </span>
              <span>{Math.round(pct)}%</span>
            </div>
            <GoldProgress value={pct} />
          </div>
        </div>
        <button
          onClick={onOpenTray}
          className="hidden sm:inline-flex items-center gap-2 rounded-md px-3 py-2 border hairline text-sm text-bone/80 hover:bg-bone/5"
        >
          Review picks
          <span className="rounded-full bg-gold/20 text-goldlight px-2 py-0.5 text-[11px] font-mono">
            {counts.rated}
          </span>
        </button>
        {renderSubmitButton()}
      </div>
      <div className="md:hidden px-4 pb-3">
        <div className="flex justify-between text-[10px] text-bone/55 mb-1">
          <span className="stamp">
            {counts.rated} / {total} rated
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
        <GoldProgress value={pct} />
      </div>
    </header>
  );
}
