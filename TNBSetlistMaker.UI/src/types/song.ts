export interface Song {
  id: string
  spotifyId: string
  title: string
  artist: string
  duration: string | null
  playlistId: string
  playlistName: string
}
