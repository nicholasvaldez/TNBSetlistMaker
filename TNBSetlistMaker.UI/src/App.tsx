import { useState, useEffect, useMemo, useCallback } from "react";
import { useSongs } from "@/hooks/use-songs";
import type { Playlist } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { MOMENTS } from "@/types/moment";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import {
  Header,
  PlaylistRail,
  ModeSwitcher,
  FooterSummary,
  StackMode,
  GridMode,
  ListMode,
  Tray,
  SubmittedModal,
  type ViewMode,
} from "@/components/setlist-builder";

const STORAGE_KEY = "tnb.curator.v2";

interface SavedState {
  ratings?: [string, SongRating][];
  moments?: [string, string[]][];
  activePlaylist?: string;
  mode?: ViewMode;
}

function loadState(): SavedState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState(s: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Ignore localStorage errors
  }
}

function App() {
  const { songs, loading, error } = useSongs();

  // Load saved state
  const saved = useMemo(() => loadState(), []);

  const [ratings, setRatings] = useState<Map<string, SongRating>>(() => new Map(saved.ratings || []));
  const [moments, setMoments] = useState<Map<string, Set<string>>>(() => {
    const m = new Map<string, Set<string>>();
    (saved.moments || []).forEach(([id, arr]) => m.set(id, new Set(arr)));
    return m;
  });
  const [activePlaylist, setActivePlaylist] = useState(saved.activePlaylist || "all");
  const [mode, setMode] = useState<ViewMode>(saved.mode || "stack");
  const [submitted, setSubmitted] = useState(false);
  const [showTray, setShowTray] = useState(false);

  // Derive playlists from songs
  const playlists = useMemo<Playlist[]>(() => {
    const map = new Map<string, Playlist>();
    songs.forEach((s) => {
      if (!map.has(s.playlistId)) {
        map.set(s.playlistId, { id: s.playlistId, name: s.playlistName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  // Persist state to localStorage
  useEffect(() => {
    saveState({
      ratings: [...ratings.entries()],
      moments: [...moments.entries()].map(([k, v]) => [k, [...v]]),
      activePlaylist,
      mode,
    });
  }, [ratings, moments, activePlaylist, mode]);

  const setRating = useCallback((id: string, bucket: SongRating) => {
    setRatings((prev) => {
      const next = new Map(prev);
      if (!bucket) next.delete(id);
      else next.set(id, bucket);
      return next;
    });
    // If song is being skipped/unrated, drop its moment tags
    if (!bucket || bucket === "skip") {
      setMoments((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const toggleMoment = useCallback((songId: string, momentId: string) => {
    setMoments((prev) => {
      const next = new Map(prev);
      const s = new Set(next.get(songId) || []);
      if (s.has(momentId)) s.delete(momentId);
      else s.add(momentId);
      if (s.size === 0) next.delete(songId);
      else next.set(songId, s);
      return next;
    });
  }, []);

  const totalCounts = useMemo(() => {
    const c = { must: 0, maybe: 0, skip: 0, rated: 0 };
    for (const [, r] of ratings) {
      if (r) {
        c[r]++;
        c.rated++;
      }
    }
    return c;
  }, [ratings]);

  const perPlaylist = useMemo(() => {
    const map: Record<string, { total: number; rated: number }> = {};
    for (const p of playlists) {
      const pSongs = songs.filter((s) => s.playlistId === p.id);
      const rated = pSongs.filter((s) => ratings.has(s.id)).length;
      map[p.id] = { total: pSongs.length, rated };
    }
    return map;
  }, [songs, playlists, ratings]);

  const momentCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const mm of MOMENTS) m[mm.id] = 0;
    for (const [, set] of moments) {
      for (const id of set) m[id] = (m[id] || 0) + 1;
    }
    return m;
  }, [moments]);

  const pctComplete = songs.length ? (totalCounts.rated / songs.length) * 100 : 0;
  const allRated = totalCounts.rated === songs.length && songs.length > 0;

  const activePlaylistName = useMemo(() => {
    if (activePlaylist === "all") return "Every song · master list";
    return playlists.find((p) => p.id === activePlaylist)?.name || "";
  }, [activePlaylist, playlists]);

  if (loading) {
    return (
      <div className="min-h-screen grain">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-20">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-bone/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grain flex items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain">
      <Header
        pct={pctComplete}
        counts={totalCounts}
        total={songs.length}
        allRated={allRated}
        onSubmit={() => setSubmitted(true)}
        onOpenTray={() => setShowTray(true)}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-40">
        <PlaylistRail playlists={playlists} active={activePlaylist} setActive={setActivePlaylist} counts={perPlaylist} />

        <div className="flex items-center justify-between mt-6 mb-2">
          <div>
            <div className="stamp">Now browsing</div>
            <h2 className="font-display text-2xl sm:text-3xl text-bone">{activePlaylistName}</h2>
          </div>
          <ModeSwitcher mode={mode} setMode={setMode} />
        </div>

        <div className="mt-6 fade-up" key={mode}>
          {mode === "stack" && (
            <StackMode
              songs={songs}
              ratings={ratings}
              setRating={setRating}
              moments={moments}
              toggleMoment={toggleMoment}
              activePlaylist={activePlaylist}
              playlists={playlists}
            />
          )}
          {mode === "grid" && (
            <GridMode
              songs={songs}
              ratings={ratings}
              setRating={setRating}
              moments={moments}
              toggleMoment={toggleMoment}
              activePlaylist={activePlaylist}
              playlists={playlists}
            />
          )}
          {mode === "list" && (
            <ListMode
              songs={songs}
              ratings={ratings}
              setRating={setRating}
              moments={moments}
              toggleMoment={toggleMoment}
              activePlaylist={activePlaylist}
              playlists={playlists}
            />
          )}
        </div>
      </div>

      <FooterSummary
        counts={totalCounts}
        total={songs.length}
        pct={pctComplete}
        allRated={allRated}
        onOpenTray={() => setShowTray(true)}
        onSubmit={() => setSubmitted(true)}
      />

      {showTray && (
        <Tray
          onClose={() => setShowTray(false)}
          songs={songs}
          ratings={ratings}
          setRating={setRating}
          moments={moments}
          toggleMoment={toggleMoment}
        />
      )}

      {submitted && (
        <SubmittedModal onClose={() => setSubmitted(false)} counts={totalCounts} momentCounts={momentCounts} />
      )}

      <ResetButton
        onReset={() => {
          setRatings(new Map());
          setMoments(new Map());
          setSubmitted(false);
        }}
      />
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={() => {
        if (confirm("Clear all ratings and tags?")) onReset();
      }}
      className="fixed bottom-4 left-4 z-10 text-[10px] text-bone/30 hover:text-bone/60 font-mono"
    >
      reset demo
    </button>
  );
}

export default App;
