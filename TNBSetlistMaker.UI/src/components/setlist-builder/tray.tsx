import { useState } from "react";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { BUCKETS } from "@/types/rating";
import { MOMENTS } from "@/types/moment";
import { AlbumArt } from "./album-art";
import { BucketPill } from "./bucket-pill";
import { MomentChip } from "./moment-chip";

interface TrayProps {
  onClose: () => void;
  songs: Song[];
  ratings: Map<string, SongRating>;
  setRating: (id: string, bucket: SongRating) => void;
  moments: Map<string, Set<string>>;
  toggleMoment: (songId: string, momentId: string) => void;
}

export function Tray({ onClose, songs, ratings, setRating, moments, toggleMoment }: TrayProps) {
  const [view, setView] = useState<"buckets" | "moments">("buckets");

  const grouped: Record<string, Song[]> = { must: [], maybe: [], skip: [] };
  songs.forEach((s) => {
    const r = ratings.get(s.id);
    if (r) grouped[r].push(s);
  });

  const byMoment: Record<string, Song[]> = {};
  for (const m of MOMENTS) byMoment[m.id] = [];
  for (const [songId, set] of moments) {
    const song = songs.find((s) => s.id === songId);
    if (!song) continue;
    for (const mid of set) byMoment[mid]?.push(song);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="paper rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[90vh] overflow-hidden ring-gold flex flex-col fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b hairline">
          <div>
            <div className="stamp">Review your picks</div>
            <h2 className="font-display text-2xl text-bone">Your setlist, so far</h2>
          </div>
          <button onClick={onClose} className="text-bone/50 hover:text-bone text-lg px-2">
            ✕
          </button>
        </div>
        <div className="px-5 pt-3">
          <div className="inline-flex rounded-md border hairline overflow-hidden bg-ink/40">
            {[
              { id: "buckets" as const, label: "By bucket" },
              { id: "moments" as const, label: "By moment" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 text-xs ${
                  view === v.id ? "bg-gold/20 text-goldlight" : "text-bone/55 hover:text-bone"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollshadow">
          {view === "buckets" &&
            BUCKETS.map((b) => (
              <div key={b.id} className="px-5 py-4 border-b hairline">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl" style={{ color: b.accent }}>
                      {b.glyph} {b.label}
                    </span>
                    <span className="font-mono text-xs text-bone/45 tabular-nums">{grouped[b.id!].length} songs</span>
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
                        <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bone/[0.03]">
                          <AlbumArt song={s} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-bone truncate">{s.title}</div>
                            <div className="text-xs text-bone/50 italic font-display truncate">{s.artist}</div>
                          </div>
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

          {view === "moments" && (
            <div className="px-5 py-4">
              <p className="text-sm text-bone/55 mb-4">
                Earmark <span className="text-goldlight">Must</span> or <span className="text-goldlight">Maybe</span>{" "}
                songs for specific moments on the day.
              </p>
              <div className="space-y-4">
                {MOMENTS.map((m) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg text-bone">
                          {m.glyph} {m.label}
                        </span>
                        <span className="font-mono text-xs text-bone/45 tabular-nums">
                          {byMoment[m.id].length} tagged
                        </span>
                      </div>
                    </div>
                    {byMoment[m.id].length === 0 ? (
                      <div className="text-sm text-bone/35 italic pl-1">None earmarked yet.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {byMoment[m.id].map((s) => (
                          <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bone/[0.03]">
                            <AlbumArt song={s} size="xs" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-bone truncate">{s.title}</div>
                              <div className="text-xs text-bone/50 italic font-display truncate">{s.artist}</div>
                            </div>
                            <BucketPill bucket={ratings.get(s.id) || null} />
                            <button
                              onClick={() => toggleMoment(s.id, m.id)}
                              className="text-[11px] text-bone/40 hover:text-skip px-1"
                              title="Remove from this moment"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
