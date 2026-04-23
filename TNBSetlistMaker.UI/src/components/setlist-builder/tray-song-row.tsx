import type { ReactNode } from "react";
import type { Song } from "@/types/song";
import { AlbumArt } from "./album-art";

interface TraySongRowProps {
  song: Song;
  children: ReactNode;
}

export function TraySongRow({ song, children }: TraySongRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bone/3">
      <AlbumArt song={song} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-bone truncate">{song.title}</div>
        <div className="text-xs text-bone/50 italic font-display truncate">{song.artist}</div>
      </div>
      {children}
    </div>
  );
}
