import { LogoMark } from "./logo-mark";
import { BUCKETS } from "@/types/rating";
import { Menu, X } from "lucide-react";

export type SubmitButtonState = "idle" | "submitted" | "editRequested" | "editApproved";

interface HeaderProps {
  counts: { must: number; maybe: number; skip: number; rated: number };
  canSubmit: boolean;
  submitState: SubmitButtonState;
  onSubmit: () => void;
  onRequestEdit: () => void;
  onOpenTray: () => void;
  showMobileMenu: boolean;
  onToggleMobileMenu: () => void;
}

export function Header({
  counts,
  canSubmit,
  submitState,
  onSubmit,
  onRequestEdit,
  onOpenTray,
  showMobileMenu,
  onToggleMobileMenu,
}: HeaderProps) {
  function renderCounts() {
    return (
      <div className="flex items-center gap-3">
        {BUCKETS.map((b) => {
          const n = counts[b.id!];
          return (
            <span
              key={b.id}
              className="flex items-center gap-1 text-[12px]"
              style={{ color: n > 0 ? b.accent : undefined }}
            >
              <span aria-hidden>{b.glyph}</span>
              <span className={`font-mono tabular-nums font-medium ${n === 0 ? "text-bone/30" : ""}`}>{n}</span>
              <span className="text-bone/40 text-[11px]">{b.short.toLowerCase()}</span>
            </span>
          );
        })}
      </div>
    );
  }
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
          Edit requested
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
    <header className="border-b hairline sticky top-0 z-20 backdrop-blur bg-tar/70">
      {/* Desktop row — hidden on mobile */}
      <div className="hidden sm:flex max-w-350 mx-auto px-4 sm:px-6 items-center gap-3 sm:gap-4">
        <LogoMark size={110} />
        <div className="shrink-0">
          <div className="stamp leading-none">The Nashville Band</div>
          <h1 className="font-display text-xl sm:text-2xl text-bone leading-tight">
            Set the Night — <span className="italic text-goldlight">Song Curator</span>
          </h1>
        </div>
        <div className="hidden md:flex flex-1 justify-center">{renderCounts()}</div>
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

      {/* Mobile bar — hamburger only */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3">
        <div className="shrink-0">
          <div className="stamp leading-none text-[9px]">The Nashville Band</div>
          <h1 className="font-display text-lg text-bone leading-tight">
            Set the Night — <span className="italic text-goldlight">Song Curator</span>
          </h1>
        </div>
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle menu"
          className="p-2 rounded-md border hairline text-bone/70 hover:text-bone hover:bg-bone/5"
        >
          {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {showMobileMenu && (
        <div className="sm:hidden border-t hairline px-4 py-4 flex flex-col gap-3">
          <div className="flex justify-center">{renderCounts()}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenTray();
                onToggleMobileMenu();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 border hairline text-sm text-bone/80 hover:bg-bone/5"
            >
              Review picks
              <span className="rounded-full bg-gold/20 text-goldlight px-2 py-0.5 text-[11px] font-mono">
                {counts.rated}
              </span>
            </button>
            {renderSubmitButton()}
          </div>
        </div>
      )}
    </header>
  );
}
