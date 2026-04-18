import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Song, Playlist } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { BUCKET_BY_ID } from "@/types/rating";
import { AlbumArt, artDataUrl } from "./album-art";
import { BucketButtons } from "./bucket-buttons";
import { BucketPill } from "./bucket-pill";
import { Preview } from "./preview";
import { MomentPicker } from "./moment-picker";
import { usePreviewUrl } from "@/hooks/use-preview-url";

interface GridModeProps {
  songs: Song[];
  ratings: Map<string, SongRating>;
  setRating: (id: string, bucket: SongRating) => void;
  activePlaylist: string;
  moments: Map<string, Set<string>>;
  toggleMoment: (songId: string, momentId: string) => void;
  playlists: Playlist[];
}

export function GridMode({
  songs,
  ratings,
  setRating,
  activePlaylist,
  moments,
  toggleMoment,
  playlists,
}: GridModeProps) {
  const filtered = useMemo(
    () => songs.filter((s) => activePlaylist === "all" || s.playlistId === activePlaylist),
    [songs, activePlaylist]
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const open = filtered.find((s) => s.id === openId);

  // Fetch preview URL when a tile is selected
  const { previewUrl, loading: previewLoading } = usePreviewUrl(open?.spotifyId);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {filtered.map((song) => {
          const r = ratings.get(song.id);
          const isOpen = song.id === openId;
          return (
            <button
              key={song.id}
              onClick={() => {
                setOpenId(isOpen ? null : song.id);
                setPlaying(false);
              }}
              className="relative text-left group"
            >
              <div
                className="aspect-square rounded-md overflow-hidden ring-gold transition-transform group-hover:-translate-y-0.5"
                style={{
                  boxShadow: r
                    ? `0 10px 24px -12px ${BUCKET_BY_ID[r].accent}80, 0 0 0 2px ${BUCKET_BY_ID[r].accent}`
                    : undefined,
                }}
              >
                <img src={artDataUrl(song)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="mt-2 px-0.5">
                <div className="text-sm font-medium text-bone truncate">{song.title}</div>
                <div className="text-xs text-bone/55 truncate italic font-display">{song.artist}</div>
              </div>
              {r && (
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  <BucketPill bucket={r} />
                  {(moments.get(song.id)?.size ?? 0) > 0 && (
                    <span className="rounded-full bg-tar/80 text-goldlight px-1.5 py-0.5 text-[10px] font-mono">
                      ✦ {moments.get(song.id)!.size}
                    </span>
                  )}
                </div>
              )}
              {isOpen && <div className="absolute inset-0 rounded-md ring-2 ring-goldlight pointer-events-none"></div>}
            </button>
          );
        })}
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 z-50 px-3 sm:px-6 pb-3 sm:pb-6 pointer-events-none">
            <div className="max-w-3xl mx-auto paper rounded-xl ring-gold p-4 sm:p-5 pointer-events-auto fade-up">
              <div className="flex items-start gap-4">
                <AlbumArt song={open} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="stamp mb-0.5">
                    {playlists.find((p) => p.id === open.playlistId)?.name || open.playlistName}
                  </div>
                  <div className="font-display text-2xl text-bone leading-tight truncate">{open.title}</div>
                  <div className="text-bone/60 text-sm italic font-display truncate">
                    {open.artist} · {open.year || "—"} · {open.duration || "—"}
                  </div>
                </div>
                <button
                  onClick={() => setOpenId(null)}
                  className="text-bone/50 hover:text-bone px-2 -mt-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3">
                <Preview song={open} playing={playing} setPlaying={setPlaying} previewUrl={previewUrl} previewLoading={previewLoading} />
              </div>
              <div className="mt-3">
                <BucketButtons
                  value={ratings.get(open.id) || null}
                  onPick={(b) => {
                    setRating(open.id, b);
                    setPlaying(false);
                  }}
                />
              </div>
              {(ratings.get(open.id) === "must" || ratings.get(open.id) === "maybe") && (
                <div className="mt-3">
                  <MomentPicker songId={open.id} moments={moments} toggleMoment={toggleMoment} />
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
