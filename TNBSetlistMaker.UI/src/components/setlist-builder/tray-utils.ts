import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { MOMENTS } from "@/types/moment";

export function groupSongsByBucket(songs: Song[], ratings: Map<string, SongRating>): Record<string, Song[]> {
  const grouped: Record<string, Song[]> = { must: [], maybe: [], skip: [] };
  songs.forEach((s) => {
    const r = ratings.get(s.id);
    if (r) grouped[r].push(s);
  });
  return grouped;
}

export function indexSongsByMoment(songs: Song[], moments: Map<string, Set<string>>): Record<string, Song[]> {
  const byMoment: Record<string, Song[]> = {};
  for (const m of MOMENTS) byMoment[m.id] = [];
  for (const [songId, set] of moments) {
    const song = songs.find((s) => s.id === songId);
    if (!song) continue;
    for (const mid of set) byMoment[mid]?.push(song);
  }
  return byMoment;
}

export function formatTotalDuration(songs: Song[]): string | null {
  const totalSeconds = songs.reduce((acc, s) => {
    if (!s.duration) return acc;
    const parts = s.duration.split(":");
    if (parts.length !== 2) return acc;
    return acc + parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }, 0);

  if (totalSeconds === 0) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs.toString().padStart(2, "0")}s`;
}
