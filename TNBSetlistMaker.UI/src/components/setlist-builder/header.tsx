import { LogoMark } from "./logo-mark";
import { GoldProgress } from "./gold-progress";

interface HeaderProps {
  pct: number;
  counts: { must: number; maybe: number; skip: number; rated: number };
  total: number;
  allRated: boolean;
  onSubmit: () => void;
  onOpenTray: () => void;
}

export function Header({ pct, counts, total, allRated, onSubmit, onOpenTray }: HeaderProps) {
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
        <button
          onClick={onSubmit}
          disabled={!allRated}
          className={`rounded-md px-3 sm:px-4 py-2 font-medium text-sm ${
            allRated ? "chip-gold" : "border hairline text-bone/35 cursor-not-allowed"
          }`}
        >
          Submit to band
        </button>
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
