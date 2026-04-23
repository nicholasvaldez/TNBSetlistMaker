import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { BUCKETS } from "@/types/rating";
import { MomentChip } from "./moment-chip";
import { TraySongRow } from "./tray-song-row";

interface TrayBucketsViewProps {
  grouped: Record<string, Song[]>;
  mustDuration: string | null;
  moments: Map<string, Set<string>>;
  setRating: (id: string, bucket: SongRating) => void;
}

export function TrayBucketsView({ grouped, mustDuration, moments, setRating }: TrayBucketsViewProps) {
  return (
    <>
      {BUCKETS.map((b) => (
        <div key={b.id} className="px-5 py-4 border-b hairline">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl" style={{ color: b.accent }}>
                {b.glyph} {b.label}
              </span>
              <span className="font-mono text-xs text-bone/45 tabular-nums">
                {grouped[b.id!].length} songs
                {b.id === "must" && mustDuration && <span className="ml-2 text-goldlight/70">· {mustDuration}</span>}
              </span>
            </div>
            <div
              className="h-px flex-1 mx-4"
              style={{ background: `linear-gradient(90deg, ${b.accent}, transparent)` }}
            />
          </div>
          {grouped[b.id!].length === 0 ? (
            <div className="text-sm text-bone/40 italic">Nothing here yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              {grouped[b.id!].map((s) => {
                const tags = moments.get(s.id);
                return (
                  <TraySongRow key={s.id} song={s}>
                    {tags && tags.size > 0 && (
                      <div className="hidden sm:flex gap-1 flex-wrap max-w-[40%] justify-end">
                        {[...tags].map((mid) => (
                          <MomentChip key={mid} moment={mid} size="xs" />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setRating(s.id, null)}
                      className="text-[11px] text-bone/40 hover:text-skip px-2"
                    >
                      undo
                    </button>
                  </TraySongRow>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
