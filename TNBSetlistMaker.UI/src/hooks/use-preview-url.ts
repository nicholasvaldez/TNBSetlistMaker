import { useState, useEffect, useRef } from "react";

// Module-level cache to avoid repeat API calls
const previewCache = new Map<string, string | null>();

interface UsePreviewUrlResult {
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function usePreviewUrl(spotifyId: string | undefined): UsePreviewUrlResult {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!spotifyId) {
      setPreviewUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first (including null results to avoid repeat failing calls)
    if (previewCache.has(spotifyId)) {
      setPreviewUrl(previewCache.get(spotifyId) ?? null);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(`/api/spotify/tracks/${spotifyId}/preview`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { previewUrl: string | null }) => {
        // Cache the result (including null)
        previewCache.set(spotifyId, data.previewUrl);
        setPreviewUrl(data.previewUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        // Cache null on error to avoid repeat failing calls
        previewCache.set(spotifyId, null);
        setPreviewUrl(null);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [spotifyId]);

  return { previewUrl, loading, error };
}
