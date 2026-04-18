import { BUCKETS } from "@/types/rating";
import { MOMENTS } from "@/types/moment";
import { LogoMark } from "./logo-mark";

interface SubmittedModalProps {
  onClose: () => void;
  counts: { must: number; maybe: number; skip: number; rated: number };
  momentCounts: Record<string, number>;
}

export function SubmittedModal({ onClose, counts, momentCounts }: SubmittedModalProps) {
  const taggedMoments = MOMENTS.filter((m) => momentCounts[m.id] > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="paper rounded-2xl ring-gold max-w-md w-full p-8 text-center fade-up">
        <div className="flex justify-center mb-4">
          <LogoMark size={56} />
        </div>
        <div className="stamp mb-2">Sent to the band</div>
        <h2 className="font-display text-4xl text-bone mb-2">Thank you.</h2>
        <p className="text-bone/70 mb-6">
          We'll build your setlist from your picks and share a draft within the week.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {BUCKETS.map((b) => (
            <div key={b.id} className="rounded-lg border hairline p-3">
              <div className="font-display text-3xl" style={{ color: b.accent }}>
                {counts[b.id!]}
              </div>
              <div className="stamp mt-0.5">{b.label}</div>
            </div>
          ))}
        </div>
        {taggedMoments.length > 0 && (
          <div className="rounded-lg border hairline p-3 mb-6 text-left">
            <div className="stamp mb-2">Earmarked moments</div>
            <div className="flex flex-wrap gap-1.5">
              {taggedMoments.map((m) => (
                <span key={m.id} className="text-xs text-goldlight">
                  {m.glyph} {m.label} <span className="font-mono text-bone/45">· {momentCounts[m.id]}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} className="chip-gold rounded-md px-4 py-2 text-sm font-medium">
          Back to the list
        </button>
      </div>
    </div>
  );
}
