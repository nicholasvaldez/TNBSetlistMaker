import { MOMENTS } from "@/types/moment";
import { MomentChip } from "./moment-chip";

interface MomentPickerProps {
  songId: string;
  moments: Map<string, Set<string>>;
  toggleMoment: (songId: string, momentId: string) => void;
  compact?: boolean;
}

export function MomentPicker({ songId, moments, toggleMoment, compact = false }: MomentPickerProps) {
  const tags = moments.get(songId) || new Set<string>();

  return (
    <div className={compact ? "" : "rounded-lg border hairline p-3 bg-ink/40"}>
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="stamp">Earmark for a moment</div>
            <div className="text-xs text-bone/55">Optional — helps us place the song in your day.</div>
          </div>
          {tags.size > 0 && <div className="font-mono text-[10px] text-goldlight">{tags.size} tagged</div>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {MOMENTS.map((m) => {
          const active = tags.has(m.id);
          return (
            <button
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleMoment(songId, m.id);
              }}
              className="btn-bucket rounded-full"
            >
              <MomentChip moment={m} active={active} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
