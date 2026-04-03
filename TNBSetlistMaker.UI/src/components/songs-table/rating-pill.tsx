import type { SongRating } from "@/types/rating";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FaHeart, FaMeh, FaTimesCircle } from "react-icons/fa";

interface RatingPillProps {
  value: SongRating;
  onChange: (value: SongRating) => void;
}

export function RatingPill({ value, onChange }: RatingPillProps) {
  return (
    <ToggleGroup
      type="single"
      value={value ?? ""}
      onValueChange={(val) => onChange((val as SongRating) || null)}
      className="gap-0 divide-x divide-border rounded-md border overflow-hidden"
    >
      <ToggleGroupItem
        value="must"
        className="rounded-none px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=on]:bg-[#5d7a5c] data-[state=on]:text-white"
      >
        <FaHeart className="mr-1.5 inline-block" />
        Must
      </ToggleGroupItem>
      <ToggleGroupItem
        value="fine"
        className="rounded-none px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=on]:bg-[#c47d32] data-[state=on]:text-white"
      >
        <FaMeh className="mr-1.5 inline-block" />
        Maybe
      </ToggleGroupItem>
      <ToggleGroupItem
        value="skip"
        className="rounded-none px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=on]:bg-[#a64d3d] data-[state=on]:text-white"
      >
        <FaTimesCircle className="mr-1.5 inline-block" />
        Skip
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
