export interface Song {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  duration: string | null;
  albumImageUrl: string | null;
  year: number | null;
  playlistId: string;
  playlistName: string;
}

export interface Playlist {
  id: string;
  name: string;
  tag?: string;
}
