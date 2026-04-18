import type { Playlist } from "@/types/song";
import { GoldProgress } from "./gold-progress";

interface PlaylistRailProps {
  playlists: Playlist[];
  active: string;
  setActive: (id: string) => void;
  counts: Record<string, { total: number; rated: number }>;
}

export function PlaylistRail({ playlists, active, setActive, counts }: PlaylistRailProps) {
  const allTotal = Object.values(counts).reduce((a, b) => a + b.total, 0);
  const allRated = Object.values(counts).reduce((a, b) => a + b.rated, 0);

  return (
    <div className="mt-5 overflow-x-auto scrollshadow -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex gap-2 sm:gap-3 min-w-max">
        <PlaylistChip
          label="All songs"
          tag="Master"
          count={allTotal}
          rated={allRated}
          active={active === "all"}
          onClick={() => setActive("all")}
        />
        {playlists.map((p) => (
          <PlaylistChip
            key={p.id}
            label={p.name}
            tag={p.tag}
            count={counts[p.id]?.total || 0}
            rated={counts[p.id]?.rated || 0}
            active={active === p.id}
            onClick={() => setActive(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface PlaylistChipProps {
  label: string;
  tag?: string;
  count: number;
  rated: number;
  active: boolean;
  onClick: () => void;
}

function PlaylistChip({ label, tag, count, rated, active, onClick }: PlaylistChipProps) {
  const pct = count ? (rated / count) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-left min-w-[180px] border transition-colors ${
        active ? "border-goldlight bg-gold/10" : "hairline bg-ink/40 hover:bg-bone/[0.03]"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-display text-lg text-bone leading-none">{label}</div>
        {tag && <div className="stamp">{tag}</div>}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <GoldProgress value={pct} className="flex-1" />
        <div className="font-mono text-[11px] text-bone/55 tabular-nums">
          {rated}/{count}
        </div>
      </div>
    </button>
  );
}
