using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Bll.Interfaces;

public interface ISpotifyService
{
    Task<string> GetAccessTokenAsync();
    Task<Playlist> GetPlaylistByUrlAsync(string url);
    
    // Added for background syncing and database persistence
    Task<Playlist> SyncPlaylistAsync(string url);
    Task SyncAllTrackedPlaylistsAsync();
}