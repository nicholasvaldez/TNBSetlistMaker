using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Domain.Interfaces;

public interface ISpotifyRepository
{
    Task<SpotifyToken?> GetTokenAsync();
    Task ReplaceTokenAsync(SpotifyToken token);
    Task<Playlist?> GetPlaylistWithSongsBySpotifyIdAsync(string spotifyId);
    Task AddPlaylistAsync(Playlist playlist);
    Task RemoveSongsAsync(IEnumerable<Song> songs);
    Task AddSongAsync(Song song);
    Task<TrackedPlaylist?> GetTrackedPlaylistBySpotifyIdAsync(string spotifyId);
    Task<IEnumerable<TrackedPlaylist>> GetAllTrackedPlaylistsAsync();
    Task<IEnumerable<Song>> GetSongsWithPlaylistAsync(string? playlistSpotifyId = null);
    Task SaveChangesAsync();
}
