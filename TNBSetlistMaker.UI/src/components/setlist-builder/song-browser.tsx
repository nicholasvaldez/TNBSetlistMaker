import { useMemo } from "react";
import type { Song, Playlist } from "@/types/song";
import type { SongRating } from "@/types/rating";
import type { ViewMode } from "./mode-switcher";
import { PlaylistRail } from "./playlist-rail";
import { ModeSwitcher } from "./mode-switcher";
import { StackMode } from "./stack-mode";
import { GridMode } from "./grid-mode";
import { ListMode } from "./list-mode";

interface SongBrowserProps {
  songs: Song[];
  playlists: Playlist[];
  ratings: Map<string, SongRating>;
  moments: Map<string, Set<string>>;
  setRating: (id: string, bucket: SongRating) => void;
  toggleMoment: (songId: string, momentId: string) => void;
  activePlaylist: string;
  setActivePlaylist: (id: string) => void;
  perPlaylist: Record<string, { total: number; rated: number }>;
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

export function SongBrowser({
  songs,
  playlists,
  ratings,
  moments,
  setRating,
  toggleMoment,
  activePlaylist,
  setActivePlaylist,
  perPlaylist,
  mode,
  setMode,
}: SongBrowserProps) {
  const activePlaylistName = useMemo(() => {
    if (activePlaylist === "all") return "Every song · master list";
    return playlists.find((p) => p.id === activePlaylist)?.name || "";
  }, [activePlaylist, playlists]);

  const viewProps = { songs, ratings, moments, setRating, toggleMoment, activePlaylist, playlists };

  return (
    <>
      <PlaylistRail playlists={playlists} active={activePlaylist} setActive={setActivePlaylist} counts={perPlaylist} />

      <div className="flex items-center justify-between mt-6 mb-2">
        <div>
          <div className="stamp">Now browsing</div>
          <h2 className="font-display text-2xl sm:text-3xl text-bone">{activePlaylistName}</h2>
        </div>
        <ModeSwitcher mode={mode} setMode={setMode} />
      </div>

      <div className="mt-6 fade-up" key={mode}>
        {mode === "stack" && <StackMode {...viewProps} />}
        {mode === "grid" && <GridMode {...viewProps} />}
        {mode === "list" && <ListMode {...viewProps} />}
      </div>
    </>
  );
}
