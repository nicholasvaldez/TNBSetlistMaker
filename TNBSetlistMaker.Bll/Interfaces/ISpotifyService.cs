using TNBSetlistMaker.Bll.Dto;

namespace TNBSetlistMaker.Bll.Interfaces;

public interface ISpotifyService
{
    Task<string> GetAccessTokenAsync();
    Task<SpotifyTracksResponseDto> GetPlaylistAsync(string playlistId);
    string GetAuthorizationUrl();
    Task ExchangeCodeForTokensAsync(string code);
    Task<string> GetOrRefreshAccessTokenAsync();
    Task SyncPlaylistAsync(string spotifyId);
    Task SyncAllTrackedPlaylistsAsync();
    Task<IEnumerable<SongWithPlaylistDto>> GetSongsAsync(string? playlistId = null);
}