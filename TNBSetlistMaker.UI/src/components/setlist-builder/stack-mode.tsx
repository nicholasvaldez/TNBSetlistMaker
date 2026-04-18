import { useState, useEffect, useRef, useMemo } from "react";
import type { Song, Playlist } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { BUCKET_BY_ID, BUCKETS } from "@/types/rating";
import { AlbumArt, paletteFor } from "./album-art";
import { Preview } from "./preview";
import { BucketButtons } from "./bucket-buttons";
import { MomentPicker } from "./moment-picker";
import { MiniEq } from "./mini-eq";
import { usePreviewUrl } from "@/hooks/use-preview-url";

interface StackModeProps {
  songs: Song[];
  ratings: Map<string, SongRating>;
  setRating: (id: string, bucket: SongRating) => void;
  activePlaylist: string;
  moments: Map<string, Set<string>>;
  toggleMoment: (songId: string, momentId: string) => void;
  playlists: Playlist[];
}

export function StackMode({
  songs,
  ratings,
  setRating,
  activePlaylist,
  moments,
  toggleMoment,
  playlists,
}: StackModeProps) {
  const [justRated, setJustRated] = useState<{ songId: string; bucket: SongRating } | null>(null);

  const filtered = useMemo(
    () => songs.filter((s) => activePlaylist === "all" || s.playlistId === activePlaylist),
    [songs, activePlaylist]
  );
  const unrated = useMemo(() => filtered.filter((s) => !ratings.get(s.id)), [filtered, ratings]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, startX: 0, startY: 0 });
  const [flinging, setFlinging] = useState<SongRating>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (idx >= unrated.length) setIdx(Math.max(0, unrated.length - 1));
  }, [unrated.length, idx]);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [activePlaylist]);

  const current = unrated[idx];
  const next1 = unrated[idx + 1];
  const next2 = unrated[idx + 2];

  // Fetch preview URL for current song on-demand
  const { previewUrl, loading: previewLoading } = usePreviewUrl(current?.spotifyId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (justRated) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advance();
        }
        return;
      }
      if (e.key === "1") commit("must");
      else if (e.key === "2") commit("maybe");
      else if (e.key === "3") commit("skip");
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") setIdx((i) => Math.min(unrated.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function commit(bucket: SongRating) {
    if (!current || flinging || !bucket) return;
    if (bucket === "skip") {
      setFlinging(bucket);
      setTimeout(() => {
        setRating(current.id, bucket);
        setFlinging(null);
        setDrag({ x: 0, y: 0, active: false, startX: 0, startY: 0 });
        setPlaying(false);
      }, 340);
    } else {
      setJustRated({ songId: current.id, bucket });
      setDrag({ x: 0, y: 0, active: false, startX: 0, startY: 0 });
      setPlaying(false);
    }
  }

  function advance() {
    if (!justRated) return;
    setRating(justRated.songId, justRated.bucket);
    setJustRated(null);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (justRated) return;
    cardRef.current?.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true, startX: e.clientX, startY: e.clientY });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag((d) => ({ ...d, x: e.clientX - d.startX, y: e.clientY - d.startY }));
  }

  function onPointerUp() {
    if (!drag.active) return;
    const { x, y } = drag;
    const absX = Math.abs(x),
      absY = Math.abs(y);
    if (absX > 90 && absX > absY) commit(x > 0 ? "must" : "skip");
    else if (y < -90) commit("maybe");
    else setDrag({ x: 0, y: 0, active: false, startX: 0, startY: 0 });
  }

  if (!current) return <StackEmpty filtered={filtered} ratings={ratings} />;

  const { x, y } = drag;
  const rot = x * 0.05;
  const hint: SongRating = x > 50 ? "must" : x < -50 ? "skip" : y < -50 ? "maybe" : null;

  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="stamp">
          Track {idx + 1} / {unrated.length} · this stack
        </div>
        <div className="flex items-center gap-2 text-xs text-bone/60">
          <kbd className="px-1.5 py-0.5 rounded border hairline bg-ink/60 font-mono">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded border hairline bg-ink/60 font-mono">→</kbd>
          <span>skip around</span>
        </div>
      </div>

      <div className="relative h-[560px] sm:h-[620px]">
        {next2 && <StackCard song={next2} depth={2} />}
        {next1 && <StackCard song={next1} depth={1} />}

        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`absolute inset-0 touch-none ${flinging ? `fling-${flinging}` : ""}`}
          style={{
            transform: flinging ? undefined : `translate(${x}px, ${y}px) rotate(${rot}deg)`,
            transition: drag.active ? "none" : "transform 280ms cubic-bezier(0.2,0.9,0.2,1)",
          }}
        >
          <HeroCard song={current} playing={playing} setPlaying={setPlaying} hint={hint} playlists={playlists} previewUrl={previewUrl} previewLoading={previewLoading} />
        </div>

        <EdgeHint side="left" active={hint === "skip"} bucket="skip" />
        <EdgeHint side="right" active={hint === "must"} bucket="must" />
        <EdgeHint side="top" active={hint === "maybe"} bucket="maybe" />
      </div>

      {!justRated && (
        <div className="mt-5">
          <BucketButtons value={null} onPick={(b) => b && commit(b)} size="lg" />
        </div>
      )}

      {justRated && (
        <div className="mt-5 paper rounded-xl ring-gold p-4 fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="stamp">
                Marked {BUCKET_BY_ID[justRated.bucket!]?.label} — is this for a moment?
              </div>
              <div className="text-xs text-bone/55 mt-0.5">Optional. Tap any that fit.</div>
            </div>
            <button onClick={advance} className="chip-gold rounded-md px-3 py-1.5 text-sm font-medium">
              Continue →
            </button>
          </div>
          <MomentPicker songId={justRated.songId} moments={moments} toggleMoment={toggleMoment} compact />
        </div>
      )}

      {!justRated && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-bone/45">
          <span>Drag the card — right to Must, up to Maybe, left to Skip.</span>
          <span className="font-mono">space · play / pause</span>
        </div>
      )}
    </div>
  );
}

function HeroCard({
  song,
  playing,
  setPlaying,
  hint,
  playlists,
  previewUrl,
  previewLoading,
}: {
  song: Song;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  hint: SongRating;
  playlists: Playlist[];
  previewUrl: string | null;
  previewLoading: boolean;
}) {
  const [bg1] = paletteFor(song.id);
  const playlistName = playlists.find((p) => p.id === song.playlistId)?.name || song.playlistName;

  return (
    <div
      className="paper rounded-2xl h-full w-full overflow-hidden relative fade-up"
      style={{
        boxShadow: `0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(227,199,122,0.18)`,
        background: `radial-gradient(circle at 50% 0%, ${bg1}45, #0f0d0b 60%), #0f0d0b`,
      }}
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <div className="stamp">Side A</div>
          <div className="w-8 h-px bg-goldlight/30"></div>
          <div className="stamp">{song.year || "—"}</div>
        </div>
        <div className="stamp">{song.duration || "—"}</div>
      </div>

      <div className="flex flex-col items-center px-5 pt-4 sm:pt-6">
        <AlbumArt song={song} size="xl" spinning={playing} />
      </div>

      <div className="px-6 pt-6 text-center">
        <div className="stamp">{playlistName}</div>
        <h1 className="font-display text-3xl sm:text-4xl leading-tight text-bone mt-1">
          {song.title}
          {playing && <MiniEq active />}
        </h1>
        <div className="text-bone/75 mt-1 italic font-display text-lg">
          by {song.artist}
        </div>
      </div>

      <div className="absolute left-6 right-6 bottom-5" onPointerDown={(e) => e.stopPropagation()}>
        <Preview song={song} playing={playing} setPlaying={setPlaying} previewUrl={previewUrl} previewLoading={previewLoading} />
      </div>

      {hint && <HintStamp bucket={hint} />}
    </div>
  );
}

function StackCard({ song, depth }: { song: Song; depth: number }) {
  const [bg] = paletteFor(song.id);
  const scale = 1 - depth * 0.04;
  const offsetY = depth * 14;
  const opacity = 1 - depth * 0.35;

  return (
    <div
      className="absolute inset-0 rounded-2xl paper overflow-hidden"
      style={{
        transform: `translateY(${offsetY}px) scale(${scale})`,
        opacity,
        background: `radial-gradient(circle at 50% 0%, ${bg}35, #0f0d0b 60%), #0f0d0b`,
        boxShadow: "0 20px 50px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(227,199,122,0.1)",
      }}
      aria-hidden
    >
      <div className="h-full w-full flex items-center justify-center opacity-60">
        <div className="font-display text-2xl text-bone/40">up next</div>
      </div>
    </div>
  );
}

function HintStamp({ bucket }: { bucket: NonNullable<SongRating> }) {
  const b = BUCKET_BY_ID[bucket];
  const pos =
    bucket === "must"
      ? "top-8 right-6 rotate-12"
      : bucket === "skip"
        ? "top-8 left-6 -rotate-12"
        : "top-6 left-1/2 -translate-x-1/2 rotate-0";

  return (
    <div
      className={`absolute ${pos} pointer-events-none select-none`}
      style={{
        color: b.accent,
        border: `2px solid ${b.accent}`,
        padding: "6px 14px",
        borderRadius: 6,
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        background: "rgba(15,13,11,0.7)",
        boxShadow: `0 0 0 4px ${b.accent}10`,
      }}
    >
      {b.verb}
    </div>
  );
}

function EdgeHint({ side, active, bucket }: { side: "left" | "right" | "top"; active: boolean; bucket: NonNullable<SongRating> }) {
  const b = BUCKET_BY_ID[bucket];
  const pos = {
    left: "left-0 top-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 -translate-y-1/2",
    top: "top-0 left-1/2 -translate-x-1/2",
  }[side];

  return (
    <div
      className={`absolute ${pos} pointer-events-none transition-opacity duration-200`}
      style={{ opacity: active ? 1 : 0.15 }}
    >
      <div
        className="stamp px-2 py-1"
        style={{
          color: b.accent,
          transform: side === "top" ? "rotate(0)" : side === "left" ? "rotate(-90deg)" : "rotate(90deg)",
        }}
      >
        {b.label}
      </div>
    </div>
  );
}

function StackEmpty({ filtered, ratings }: { filtered: Song[]; ratings: Map<string, SongRating> }) {
  const counts = { must: 0, maybe: 0, skip: 0 };
  filtered.forEach((s) => {
    const r = ratings.get(s.id);
    if (r) counts[r]++;
  });

  return (
    <div className="max-w-[640px] mx-auto paper rounded-2xl p-8 sm:p-12 text-center ring-gold">
      <div className="stamp mb-3">Stack cleared</div>
      <div className="font-display text-4xl text-bone mb-2">You called every tune.</div>
      <p className="text-bone/65 max-w-sm mx-auto">
        Switch to another playlist above, or review your picks in the tray below.
      </p>
      <div className="grid grid-cols-3 gap-2 mt-6 max-w-sm mx-auto">
        {BUCKETS.map((b) => (
          <div key={b.id} className="rounded-lg border hairline p-3">
            <div className="font-display text-3xl" style={{ color: b.accent }}>
              {counts[b.id!]}
            </div>
            <div className="stamp mt-0.5">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
