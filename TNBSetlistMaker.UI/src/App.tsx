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
  SubmitFormModal,
  RestoreSessionInput,
  type ViewMode,
} from "@/components/setlist-builder";
import type { SubmitButtonState } from "@/components/setlist-builder/header";
import { generateSetlistPdfBase64 } from "@/components/setlist-builder/setlist-pdf";

const STORAGE_KEY = "tnb.curator.v2";
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5152";

interface SavedState {
  ratings?: [string, SongRating][];
  moments?: [string, string[]][];
  activePlaylist?: string;
  mode?: ViewMode;
  setlistCode?: string;
  submitState?: SubmitButtonState;
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

  const [ratings, setRatings] = useState<Map<string, SongRating>>(() => new Map(saved.ratings || []));
  const [moments, setMoments] = useState<Map<string, Set<string>>>(() => {
    const m = new Map<string, Set<string>>();
    (saved.moments || []).forEach(([id, arr]) => m.set(id, new Set(arr)));
    return m;
  });
  const [activePlaylist, setActivePlaylist] = useState(saved.activePlaylist || "all");
  const [mode, setMode] = useState<ViewMode>(saved.mode || "list");
  const [showTray, setShowTray] = useState(false);

  // Submit flow
  const [setlistCode, setSetlistCode] = useState<string | undefined>(saved.setlistCode);
  const [submitState, setSubmitState] = useState<SubmitButtonState>(saved.submitState ?? "idle");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // On mount: check for ?editApproved= query param (bandleader clicked approval link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const approvedCode = params.get("editApproved");
    if (approvedCode && approvedCode === setlistCode) {
      setSubmitState("editApproved");
      window.history.replaceState({}, "", "/");
    }
  }, [setlistCode]);

  // Persist state
  useEffect(() => {
    saveState({
      ratings: [...ratings.entries()],
      moments: [...moments.entries()].map(([k, v]) => [k, [...v]]),
      activePlaylist,
      mode,
      setlistCode,
      submitState,
    });
  }, [ratings, moments, activePlaylist, mode, setlistCode, submitState]);

  // Derive playlists from songs
  const playlists = useMemo<Playlist[]>(() => {
    const map = new Map<string, Playlist>();
    songs.forEach((s) => {
      if (!map.has(s.playlistId)) map.set(s.playlistId, { id: s.playlistId, name: s.playlistName });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  const setRating = useCallback((id: string, bucket: SongRating) => {
    setRatings((prev) => {
      const next = new Map(prev);
      if (!bucket) next.delete(id);
      else next.set(id, bucket);
      return next;
    });
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
      map[p.id] = { total: pSongs.length, rated: pSongs.filter((s) => ratings.has(s.id)).length };
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
  const canSubmit = ratings.size > 0;

  const activePlaylistName = useMemo(() => {
    if (activePlaylist === "all") return "Every song · master list";
    return playlists.find((p) => p.id === activePlaylist)?.name || "";
  }, [activePlaylist, playlists]);

  // ── Submit flow ─────────────────────────────────────────────────────────────

  async function handleConfirmSubmit(eventName: string, eventDate: string, clientEmail: string) {
    setSubmitting(true);
    try {
      const pdfBase64 = await generateSetlistPdfBase64({
        eventName,
        eventDate: eventDate || undefined,
        songs,
        ratings,
        moments,
      });

      const entries = [...ratings.entries()]
        .filter(([, r]) => r !== null)
        .map(([songId, rating]) => ({
          songId,
          rating,
          momentIds: [...(moments.get(songId) ?? [])],
        }));

      const res = await fetch(`${API_BASE}/api/setlist/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, eventDate: eventDate || null, clientEmail, entries, pdfBase64 }),
      });

      if (!res.ok) throw new Error("Submission failed");
      const { code } = await res.json();
      setSetlistCode(code);
      setSubmitState("submitted");
      setShowSubmitForm(false);
      setShowConfirmation(true);
    } catch {
      // TODO: show error toast
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestEdit() {
    if (!setlistCode) return;
    await fetch(`${API_BASE}/api/setlist/${setlistCode}/request-edit`, { method: "POST" });
    setSubmitState("editRequested");
  }

  async function handleRestoreSession(code: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/setlist/${code}`);
    if (!res.ok) return false;

    const data = await res.json();

    // Repopulate ratings
    const newRatings = new Map<string, SongRating>();
    const newMoments = new Map<string, Set<string>>();
    for (const entry of data.entries ?? []) {
      newRatings.set(entry.songId, entry.rating as SongRating);
      if (entry.momentIds?.length) newMoments.set(entry.songId, new Set(entry.momentIds));
    }

    setRatings(newRatings);
    setMoments(newMoments);
    setSetlistCode(code);
    setSubmitState(
      data.status === "Submitted"
        ? "submitted"
        : data.status === "EditRequested"
          ? "editRequested"
          : data.status === "EditApproved"
            ? "editApproved"
            : "idle",
    );

    return true;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
        pct={pctComplete}
        counts={totalCounts}
        total={songs.length}
        canSubmit={canSubmit}
        submitState={submitState}
        onSubmit={() => setShowSubmitForm(true)}
        onRequestEdit={handleRequestEdit}
        onOpenTray={() => setShowTray(true)}
      />

      <div className="max-w-350 mx-auto px-4 sm:px-6 pb-40">
        <PlaylistRail
          playlists={playlists}
          active={activePlaylist}
          setActive={setActivePlaylist}
          counts={perPlaylist}
        />

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
        canSubmit={canSubmit}
        submitState={submitState}
        onOpenTray={() => setShowTray(true)}
        onSubmit={() => setShowSubmitForm(true)}
        onRequestEdit={handleRequestEdit}
      />

      {/* Restore session — shown in footer area */}
      <div className="fixed bottom-16 sm:bottom-4 left-4 z-10">
        {submitState === "idle" && <RestoreSessionInput onRestore={handleRestoreSession} />}
      </div>

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

      {showSubmitForm && (
        <SubmitFormModal
          onClose={() => setShowSubmitForm(false)}
          onConfirm={handleConfirmSubmit}
          isResubmit={submitState === "editApproved"}
          submitting={submitting}
        />
      )}

      {showConfirmation && (
        <SubmittedModal
          onClose={() => setShowConfirmation(false)}
          counts={totalCounts}
          momentCounts={momentCounts}
          setlistCode={setlistCode}
        />
      )}
    </div>
  );
}

export default App;
