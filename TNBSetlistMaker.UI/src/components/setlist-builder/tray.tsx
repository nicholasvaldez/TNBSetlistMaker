import { useState } from "react";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { groupSongsByBucket, indexSongsByMoment, formatTotalDuration } from "./tray-utils";
import { TrayBucketsView } from "./tray-buckets-view";
import { TrayMomentsView } from "./tray-moments-view";

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

  const grouped = groupSongsByBucket(songs, ratings);
  const byMoment = indexSongsByMoment(songs, moments);
  const mustDuration = formatTotalDuration(grouped["must"]);

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
            {(["buckets", "moments"] as const).map((id) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3 py-1.5 text-xs ${
                  view === id ? "bg-gold/20 text-goldlight" : "text-bone/55 hover:text-bone"
                }`}
              >
                {id === "buckets" ? "By bucket" : "By moment"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollshadow">
          {view === "buckets" && (
            <TrayBucketsView grouped={grouped} mustDuration={mustDuration} moments={moments} setRating={setRating} />
          )}
          {view === "moments" && <TrayMomentsView byMoment={byMoment} ratings={ratings} toggleMoment={toggleMoment} />}
        </div>
      </div>
    </div>
  );
}
