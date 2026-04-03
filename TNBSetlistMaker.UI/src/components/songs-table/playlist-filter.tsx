import type { Column } from "@tanstack/react-table";
import type { Song } from "@/types/song";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaCompactDisc } from "react-icons/fa";

interface PlaylistFilterProps {
  column: Column<Song>;
  options: string[];
}

export function PlaylistFilter({ column, options }: PlaylistFilterProps) {
  const selected = (column.getFilterValue() as string[] | undefined) ?? [];

  function toggle(playlist: string) {
    const next = selected.includes(playlist) ? selected.filter((p) => p !== playlist) : [...selected, playlist];
    column.setFilterValue(next.length ? next : undefined);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 h-10 border border-input bg-transparent hover:bg-accent"
        >
          <FaCompactDisc className="text-muted-foreground" />
          Playlist
          {selected.length > 0 && (
            <Badge variant="default" className="ml-1 rounded-full px-1.5 py-0.5 text-xs leading-none">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(option)} />
                {option}
              </label>
            );
          })}
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.setFilterValue(undefined)}
              className="mt-1 h-auto justify-start px-2 py-1 text-xs text-muted-foreground"
            >
              Clear filter
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
