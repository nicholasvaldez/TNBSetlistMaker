import { useState, useMemo } from "react";
import type { Song, Playlist } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { BUCKET_BY_ID } from "@/types/rating";
import { AlbumArt } from "./album-art";
import { BucketPill } from "./bucket-pill";
import { BucketButtons } from "./bucket-buttons";
import { Preview } from "./preview";
import { MiniEq } from "./mini-eq";
import { MomentPicker } from "./moment-picker";
import { usePreviewUrl } from "@/hooks/use-preview-url";

interface ListModeProps {
  songs: Song[];
  ratings: Map<string, SongRating>;
  setRating: (id: string, bucket: SongRating) => void;
  activePlaylist: string;
  moments: Map<string, Set<string>>;
  toggleMoment: (songId: string, momentId: string) => void;
  playlists: Playlist[];
}

export function ListMode({
  songs,
  ratings,
  setRating,
  activePlaylist,
  moments,
  toggleMoment,
  playlists,
}: ListModeProps) {
  const filtered = useMemo(
    () => songs.filter((s) => activePlaylist === "all" || s.playlistId === activePlaylist),
    [songs, activePlaylist],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const openSong = filtered.find((s) => s.id === openId);
  const { previewUrl, loading: previewLoading } = usePreviewUrl(openSong?.spotifyId);

  return (
    <div className="w-full paper rounded-xl ring-gold overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 sm:px-5 py-3 border-b hairline stamp">
        <div className="w-22">#</div>
        <div>Title</div>
        <div className="hidden sm:block">Playlist</div>
        <div>Pick</div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto scrollshadow">
        {filtered.map((song, i) => {
          const r = ratings.get(song.id);
          const isOpen = song.id === openId;
          const rowBg = r ? `${BUCKET_BY_ID[r].accent}10` : undefined;
          return (
            <div key={song.id} className="border-b hairline tick-row" style={{ background: rowBg }}>
              <button
                onClick={() => {
                  setOpenId(isOpen ? null : song.id);
                  setPlaying(false);
                }}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 sm:px-5 py-3 items-center w-full text-left hover:bg-bone/3"
              >
                <div className="w-22 flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-bone/40 w-5 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <AlbumArt song={song} size="xs" />
                </div>
                <div className="min-w-0">
                  <div className="text-bone font-medium truncate flex items-center">
                    {song.title}
                    {isOpen && playing && <MiniEq active />}
                  </div>
                  <div className="text-xs text-bone/55 italic font-display truncate">
                    {song.artist} · {song.year || "—"} · {song.duration || "—"}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="stamp">
                    {playlists.find((p) => p.id === song.playlistId)?.name || song.playlistName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(moments.get(song.id)?.size ?? 0) > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-goldlight font-mono">
                      ✦ {moments.get(song.id)!.size}
                    </span>
                  )}
                  {r ? <BucketPill bucket={r} /> : <span className="text-xs text-bone/35">tap</span>}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 pt-1 fade-up">
                  <Preview
                    song={song}
                    playing={playing}
                    setPlaying={setPlaying}
                    previewUrl={previewUrl}
                    previewLoading={previewLoading}
                  />
                  <div className="mt-3">
                    <BucketButtons value={r || null} onPick={(b) => setRating(song.id, b)} />
                  </div>
                  {(r === "must" || r === "maybe") && (
                    <div className="mt-3">
                      <MomentPicker songId={song.id} moments={moments} toggleMoment={toggleMoment} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
