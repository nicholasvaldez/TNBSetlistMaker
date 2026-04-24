import { useState, useEffect, useMemo, useCallback } from "react";
import { useSongs } from "@/hooks/use-songs";
import { useRatings } from "@/hooks/use-ratings";
import { useSetlistSubmit } from "@/hooks/use-setlist-submit";
import type { Playlist } from "@/types/song";
import type { SongRating } from "@/types/rating";
import type { CustomRequest } from "@/types/custom-request";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Header, FooterSummary, SongBrowser, AppModals, type ViewMode } from "@/components/setlist-builder";
import type { SubmitButtonState } from "@/components/setlist-builder/header";

const STORAGE_KEY = "tnb.curator.v2";

interface SavedState {
  ratings?: [string, SongRating][];
  moments?: [string, string[]][];
  activePlaylist?: string;
  mode?: ViewMode;
  setlistCode?: string;
  submitState?: SubmitButtonState;
  customRequests?: CustomRequest[];
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
  } catch {}
}

function App() {
  const { songs, loading, error } = useSongs();
  const saved = useMemo(() => loadState(), []);

  const { ratings, moments, setRating, toggleMoment, setRatings, setMoments, totalCounts, momentCounts } = useRatings(
    new Map(saved.ratings || []),
    new Map((saved.moments || []).map(([k, v]) => [k, new Set(v)])),
  );

  const [activePlaylist, setActivePlaylist] = useState(saved.activePlaylist || "all");
  const [mode, setMode] = useState<ViewMode>(() => {
    if (saved.mode) return saved.mode;
    if (typeof window === "undefined") return "list";
    if (window.innerWidth < 640) return "stack";
    if (window.innerWidth < 1024) return "grid";
    return "list";
  });
  const [showTray, setShowTray] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(false);

  const [customRequests, setCustomRequests] = useState<CustomRequest[]>(saved.customRequests ?? []);
  const [restoredDetails, setRestoredDetails] = useState({ eventName: "", eventDate: "", clientEmail: "" });

  const addCustomRequest = useCallback(() => {
    setCustomRequests((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, { id: crypto.randomUUID(), title: "", artist: "" }];
    });
  }, []);

  const updateCustomRequest = useCallback((id: string, patch: Partial<Omit<CustomRequest, "id">>) => {
    setCustomRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeCustomRequest = useCallback((id: string) => {
    setCustomRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const submit = useSetlistSubmit({
    songs,
    ratings,
    moments,
    customRequests,
    initialCode: saved.setlistCode,
    initialSubmitState: saved.submitState ?? "idle",
    onRestoreRatings: (r, m) => {
      setRatings(r);
      setMoments(m);
    },
    onRestoreCustomRequests: (cr) => setCustomRequests(cr),
    onRestoreEventDetails: (en, ed, ce) => setRestoredDetails({ eventName: en, eventDate: ed, clientEmail: ce }),
  });

  useEffect(() => {
    saveState({
      ratings: [...ratings.entries()],
      moments: [...moments.entries()].map(([k, v]) => [k, [...v]]),
      activePlaylist,
      mode,
      setlistCode: submit.setlistCode,
      submitState: submit.submitState,
      customRequests,
    });
  }, [ratings, moments, activePlaylist, mode, submit.setlistCode, submit.submitState, customRequests]);

  const playlists = useMemo<Playlist[]>(() => {
    const map = new Map<string, Playlist>();
    songs.forEach((s) => {
      if (!map.has(s.playlistId)) map.set(s.playlistId, { id: s.playlistId, name: s.playlistName });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  const perPlaylist = useMemo(() => {
    const map: Record<string, { total: number; rated: number }> = {};
    for (const p of playlists) {
      const pSongs = songs.filter((s) => s.playlistId === p.id);
      map[p.id] = { total: pSongs.length, rated: pSongs.filter((s) => ratings.has(s.id)).length };
    }
    return map;
  }, [songs, playlists, ratings]);

  const pctComplete = songs.length ? (totalCounts.rated / songs.length) * 100 : 0;
  const canSubmit = ratings.size > 0;

  if (loading) {
    return (
      <div className="min-h-screen grain">
        <div className="max-w-350 mx-auto px-4 sm:px-6 py-20">
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
        counts={totalCounts}
        canSubmit={canSubmit}
        submitState={submit.submitState}
        onSubmit={() => submit.setShowSubmitForm(true)}
        onRequestEdit={submit.handleRequestEdit}
        onOpenTray={() => setShowTray(true)}
        showMobileMenu={showMobileHeader}
        onToggleMobileMenu={() => setShowMobileHeader((v) => !v)}
      />

      <div className="max-w-350 mx-auto px-4 sm:px-6 pb-40">
        <SongBrowser
          songs={songs}
          playlists={playlists}
          ratings={ratings}
          moments={moments}
          setRating={setRating}
          toggleMoment={toggleMoment}
          activePlaylist={activePlaylist}
          setActivePlaylist={setActivePlaylist}
          perPlaylist={perPlaylist}
          mode={mode}
          setMode={setMode}
        />
      </div>

      <FooterSummary
        counts={totalCounts}
        total={songs.length}
        pct={pctComplete}
        canSubmit={canSubmit}
        submitState={submit.submitState}
        onOpenTray={() => setShowTray(true)}
        onSubmit={() => submit.setShowSubmitForm(true)}
        onRequestEdit={submit.handleRequestEdit}
      />

      <AppModals
        songs={songs}
        ratings={ratings}
        moments={moments}
        setRating={setRating}
        toggleMoment={toggleMoment}
        totalCounts={totalCounts}
        momentCounts={momentCounts}
        customRequests={customRequests}
        addCustomRequest={addCustomRequest}
        updateCustomRequest={updateCustomRequest}
        removeCustomRequest={removeCustomRequest}
        submitState={submit.submitState}
        setlistCode={submit.setlistCode}
        submitting={submit.submitting}
        showTray={showTray}
        showSubmitForm={submit.showSubmitForm}
        showConfirmation={submit.showConfirmation}
        onCloseTray={() => setShowTray(false)}
        onCloseSubmitForm={() => submit.setShowSubmitForm(false)}
        onCloseConfirmation={() => submit.setShowConfirmation(false)}
        onConfirmSubmit={submit.handleConfirmSubmit}
        onRestoreSession={submit.handleRestoreSession}
        restoredDetails={restoredDetails}
      />
    </div>
  );
}

export default App;
