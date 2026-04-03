import { useState, useEffect } from "react"
import type { Song } from "@/types/song"

interface UseSongsResult {
  songs: Song[]
  loading: boolean
  error: string | null
}

export function useSongs(playlistId?: string): UseSongsResult {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = import.meta.env.VITE_API_URL
        const url = playlistId
          ? `${apiUrl}/api/spotify/songs?playlistId=${playlistId}`
          : `${apiUrl}/api/spotify/songs`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch songs: ${response.statusText}`)
        }

        const data = await response.json()
        setSongs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [playlistId])

  return { songs, loading, error }
}
