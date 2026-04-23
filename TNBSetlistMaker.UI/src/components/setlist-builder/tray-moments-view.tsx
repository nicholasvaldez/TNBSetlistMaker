import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { MOMENTS } from "@/types/moment";
import { BucketPill } from "./bucket-pill";
import { TraySongRow } from "./tray-song-row";

interface TrayMomentsViewProps {
  byMoment: Record<string, Song[]>;
  ratings: Map<string, SongRating>;
  toggleMoment: (songId: string, momentId: string) => void;
}

export function TrayMomentsView({ byMoment, ratings, toggleMoment }: TrayMomentsViewProps) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm text-bone/55 mb-4">
        Earmark <span className="text-goldlight">Must</span> or <span className="text-goldlight">Maybe</span> songs for
        specific moments on the day.
      </p>
      <div className="space-y-4">
        {MOMENTS.map((m) => (
          <div key={m.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg text-bone">
                  {m.glyph} {m.label}
                </span>
                <span className="font-mono text-xs text-bone/45 tabular-nums">{byMoment[m.id].length} tagged</span>
              </div>
            </div>
            {byMoment[m.id].length === 0 ? (
              <div className="text-sm text-bone/35 italic pl-1">None earmarked yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {byMoment[m.id].map((s) => (
                  <TraySongRow key={s.id} song={s}>
                    <BucketPill bucket={ratings.get(s.id) || null} />
                    <button
                      onClick={() => toggleMoment(s.id, m.id)}
                      className="text-[11px] text-bone/40 hover:text-skip px-1"
                      title="Remove from this moment"
                    >
                      ✕
                    </button>
                  </TraySongRow>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
