import { useState, useCallback, useMemo } from "react";
import type { SongRating } from "@/types/rating";
import { MOMENTS } from "@/types/moment";

export interface RatingsState {
  ratings: Map<string, SongRating>;
  moments: Map<string, Set<string>>;
  setRating: (id: string, bucket: SongRating) => void;
  toggleMoment: (songId: string, momentId: string) => void;
  setRatings: React.Dispatch<React.SetStateAction<Map<string, SongRating>>>;
  setMoments: React.Dispatch<React.SetStateAction<Map<string, Set<string>>>>;
  totalCounts: { must: number; maybe: number; skip: number; rated: number };
  momentCounts: Record<string, number>;
}

export function useRatings(
  initialRatings: Map<string, SongRating>,
  initialMoments: Map<string, Set<string>>,
): RatingsState {
  const [ratings, setRatings] = useState<Map<string, SongRating>>(initialRatings);
  const [moments, setMoments] = useState<Map<string, Set<string>>>(initialMoments);

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

  const momentCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const mm of MOMENTS) m[mm.id] = 0;
    for (const [, set] of moments) {
      for (const id of set) m[id] = (m[id] || 0) + 1;
    }
    return m;
  }, [moments]);

  return { ratings, moments, setRating, toggleMoment, setRatings, setMoments, totalCounts, momentCounts };
}
