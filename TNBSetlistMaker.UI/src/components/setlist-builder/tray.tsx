import { useState } from "react";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import type { CustomRequest } from "@/types/custom-request";
import { groupSongsByBucket, indexSongsByMoment, formatTotalDuration } from "./tray-utils";
import { TrayBucketsView } from "./tray-buckets-view";
import { TrayMomentsView } from "./tray-moments-view";
import { TrayCustomRequestsView } from "./tray-custom-requests-view";

interface TrayProps {
  onClose: () => void;
  songs: Song[];
  ratings: Map<string, SongRating>;
  setRating: (id: string, bucket: SongRating) => void;
  moments: Map<string, Set<string>>;
  toggleMoment: (songId: string, momentId: string) => void;
  customRequests: CustomRequest[];
  addCustomRequest: () => void;
  updateCustomRequest: (id: string, patch: Partial<Omit<CustomRequest, "id">>) => void;
  removeCustomRequest: (id: string) => void;
}

export function Tray({
  onClose,
  songs,
  ratings,
  setRating,
  moments,
  toggleMoment,
  customRequests,
  addCustomRequest,
  updateCustomRequest,
  removeCustomRequest,
}: TrayProps) {
  const [view, setView] = useState<"buckets" | "moments" | "requests">("buckets");

  const grouped = groupSongsByBucket(songs, ratings);
  const byMoment = indexSongsByMoment(songs, moments);
  const mustDuration = formatTotalDuration(grouped["must"]);

  const tabs: { id: "buckets" | "moments" | "requests"; label: string; badge?: number }[] = [
    { id: "buckets", label: "By bucket" },
    { id: "moments", label: "By moment" },
    { id: "requests", label: "Requests", badge: customRequests.length > 0 ? customRequests.length : undefined },
  ];

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
            {tabs.map(({ id, label, badge }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                  view === id ? "bg-gold/20 text-goldlight" : "text-bone/55 hover:text-bone"
                }`}
              >
                {label}
                {badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none ${view === id ? "bg-gold/30 text-goldlight" : "bg-bone/10 text-bone/50"}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollshadow">
          {view === "buckets" && (
            <TrayBucketsView grouped={grouped} mustDuration={mustDuration} moments={moments} setRating={setRating} />
          )}
          {view === "moments" && <TrayMomentsView byMoment={byMoment} ratings={ratings} toggleMoment={toggleMoment} />}
          {view === "requests" && (
            <TrayCustomRequestsView
              customRequests={customRequests}
              addCustomRequest={addCustomRequest}
              updateCustomRequest={updateCustomRequest}
              removeCustomRequest={removeCustomRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
}
