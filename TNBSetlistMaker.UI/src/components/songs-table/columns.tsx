import type { ColumnDef } from "@tanstack/react-table";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingPill } from "@/components/songs-table/rating-pill";

const PLAYLIST_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-teal-500/20 text-teal-300 border-teal-500/30",
];

function playlistColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PLAYLIST_COLORS[hash % PLAYLIST_COLORS.length];
}

export const columns: ColumnDef<Song>[] = [
  {
    accessorKey: "artist",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Artist
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("artist")}</span>,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
  },
  {
    id: "rating",
    header: "Rating",
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | {
            ratings: Map<string, SongRating>;
            setRating: (id: string, r: SongRating) => void;
          }
        | undefined;
      const song = row.original;
      return <RatingPill value={meta?.ratings.get(song.id) ?? null} onChange={(r) => meta?.setRating(song.id, r)} />;
    },
  },
  {
    accessorKey: "playlistName",
    filterFn: (row, columnId, filterValue: string[]) =>
      !filterValue?.length || filterValue.includes(row.getValue(columnId)),
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Playlist
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name: string = row.getValue("playlistName");
      return (
        <Badge variant="outline" className={`text-xs font-normal ${playlistColor(name)}`}>
          {name}
        </Badge>
      );
    },
  },
];
