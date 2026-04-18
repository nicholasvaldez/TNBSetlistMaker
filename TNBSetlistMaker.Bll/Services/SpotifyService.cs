using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Web;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TNBSetlistMaker.Bll.Dto;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Dal.Data;
using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Bll.Services;

public class SpotifyService : ISpotifyService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly AppDbContext _context;
    private const string AuthUrl = "https://accounts.spotify.com/authorize";
    private const string TokenUrl = "https://accounts.spotify.com/api/token";
    private const string Scopes = "playlist-read-private playlist-read-collaborative";

    public SpotifyService(HttpClient httpClient, IConfiguration config, AppDbContext context)
    {
        _httpClient = httpClient;
        _config = config;
        _context = context;
    }

    public string GetAuthorizationUrl()
    {
        var clientId = _config["Spotify:ClientId"];
        var redirectUri = _config["Spotify:RedirectUri"];

        var queryParams = HttpUtility.ParseQueryString(string.Empty);
        queryParams["client_id"] = clientId;
        queryParams["response_type"] = "code";
        queryParams["redirect_uri"] = redirectUri;
        queryParams["scope"] = Scopes;

        return $"{AuthUrl}?{queryParams}";
    }

    public async Task ExchangeCodeForTokensAsync(string code)
    {
        var clientId = _config["Spotify:ClientId"];
        var clientSecret = _config["Spotify:ClientSecret"];
        var redirectUri = _config["Spotify:RedirectUri"];

        var request = new HttpRequestMessage(HttpMethod.Post, TokenUrl);
        var authHeader = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "grant_type", "authorization_code" },
            { "code", code },
            { "redirect_uri", redirectUri! }
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();
        var accessToken = content.GetProperty("access_token").GetString()!;
        var refreshToken = content.GetProperty("refresh_token").GetString()!;
        var expiresIn = content.GetProperty("expires_in").GetInt32();

        // Remove any existing tokens and store the new one
        var existingTokens = await _context.SpotifyTokens.ToListAsync();
        _context.SpotifyTokens.RemoveRange(existingTokens);

        var token = new SpotifyToken
        {
            Id = Guid.NewGuid(),
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn - 60), // Buffer of 60 seconds
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SpotifyTokens.Add(token);
        await _context.SaveChangesAsync();
    }

    public async Task<string> GetOrRefreshAccessTokenAsync()
    {
        var token = await _context.SpotifyTokens.FirstOrDefaultAsync();

        if (token == null)
        {
            throw new InvalidOperationException("No Spotify token found. Please authenticate at /auth/spotify/login");
        }

        // If token is expired or about to expire, refresh it
        if (DateTime.UtcNow >= token.ExpiresAt)
        {
            await RefreshAccessTokenAsync(token);
        }

        return token.AccessToken;
    }

    private async Task RefreshAccessTokenAsync(SpotifyToken token)
    {
        var clientId = _config["Spotify:ClientId"];
        var clientSecret = _config["Spotify:ClientSecret"];

        var request = new HttpRequestMessage(HttpMethod.Post, TokenUrl);
        var authHeader = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "grant_type", "refresh_token" },
            { "refresh_token", token.RefreshToken }
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();
        var accessToken = content.GetProperty("access_token").GetString()!;
        var expiresIn = content.GetProperty("expires_in").GetInt32();

        // Update the token in the database
        token.AccessToken = accessToken;
        token.ExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn - 60);
        token.UpdatedAt = DateTime.UtcNow;

        // Spotify may return a new refresh token
        if (content.TryGetProperty("refresh_token", out var newRefreshToken))
        {
            token.RefreshToken = newRefreshToken.GetString()!;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<string> GetAccessTokenAsync()
    {
        var clientId = _config["Spotify:ClientId"];
        var clientSecret = _config["Spotify:ClientSecret"];

        var request = new HttpRequestMessage(HttpMethod.Post, TokenUrl);
        var authHeader = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            {"grant_type", "client_credentials"}
        });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();
        return content.GetProperty("access_token").GetString() ?? string.Empty;
    }

    public async Task<SpotifyTracksResponseDto> GetPlaylistAsync(string playlistId)
    {
        var token = await GetOrRefreshAccessTokenAsync();

        // 1. Use the /items endpoint (Feb 2026 API update)
        var fields = "items(item(id,name,duration_ms,preview_url,artists(name),album(images,release_date))),next";
        var baseUrl = $"https://api.spotify.com/v1/playlists/{playlistId}/items?market=US&fields={fields}";

        var request = new HttpRequestMessage(HttpMethod.Get, baseUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("Accept", "application/json");
        request.Headers.Add("User-Agent", "TNBSetlistMaker/1.0");

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            var headers = string.Join(", ", response.Headers.Select(h => $"{h.Key}: {string.Join(",", h.Value)}"));
            throw new Exception($"Spotify API error ({response.StatusCode}): {error} | Headers: {headers}");
        }

        var spotifyData = await response.Content.ReadFromJsonAsync<SpotifyTracksResponseDto>();
        if (spotifyData == null) throw new Exception("Failed to get track data.");

        // 2. Pagination Loop (Ensures you get more than the first 100 songs)
        var nextUrl = spotifyData.Next;
        while (!string.IsNullOrEmpty(nextUrl))
        {
            var pageRequest = new HttpRequestMessage(HttpMethod.Get, nextUrl);
            pageRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var pageResponse = await _httpClient.SendAsync(pageRequest);
            if (!pageResponse.IsSuccessStatusCode) break;

            var page = await pageResponse.Content.ReadFromJsonAsync<SpotifyTracksResponseDto>();
            if (page == null) break;

            spotifyData.Items.AddRange(page.Items);
            nextUrl = page.Next;
        }

        return spotifyData;
    }

    private async Task<(string Name, string? Description, string? ImageUrl)> GetPlaylistMetadataAsync(string playlistId)
    {
        var token = await GetOrRefreshAccessTokenAsync();
        var url = $"https://api.spotify.com/v1/playlists/{playlistId}?fields=name,description,images";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();
        var name = content.GetProperty("name").GetString() ?? playlistId;
        var description = content.TryGetProperty("description", out var desc) ? desc.GetString() : null;
        string? imageUrl = null;
        if (content.TryGetProperty("images", out var images) && images.GetArrayLength() > 0)
        {
            imageUrl = images[0].GetProperty("url").GetString();
        }

        return (name, description, imageUrl);
    }

    public async Task SyncPlaylistAsync(string spotifyId)
    {
        // Fetch playlist metadata and tracks from Spotify
        var metadata = await GetPlaylistMetadataAsync(spotifyId);
        var spotifyData = await GetPlaylistAsync(spotifyId);

        // Upsert Playlist
        var playlist = await _context.Playlists
            .Include(p => p.Songs)
            .FirstOrDefaultAsync(p => p.SpotifyId == spotifyId);

        if (playlist == null)
        {
            playlist = new Playlist
            {
                Id = Guid.NewGuid(),
                SpotifyId = spotifyId,
                Name = metadata.Name,
                Description = metadata.Description,
                ImageUrl = metadata.ImageUrl
            };
            _context.Playlists.Add(playlist);
        }
        else
        {
            playlist.Name = metadata.Name;
            playlist.Description = metadata.Description;
            playlist.ImageUrl = metadata.ImageUrl;
        }

        // Get current Spotify track IDs
        var currentSpotifyTrackIds = spotifyData.Items
            .Where(i => i.Item != null && !string.IsNullOrEmpty(i.Item.Id))
            .Select(i => i.Item.Id)
            .ToHashSet();

        // Remove songs that are no longer in the playlist
        var songsToRemove = playlist.Songs
            .Where(s => !currentSpotifyTrackIds.Contains(s.SpotifyId))
            .ToList();
        _context.Songs.RemoveRange(songsToRemove);

        // Upsert songs
        foreach (var item in spotifyData.Items)
        {
            if (item.Item == null || string.IsNullOrEmpty(item.Item.Id))
                continue;

            var existingSong = playlist.Songs.FirstOrDefault(s => s.SpotifyId == item.Item.Id);
            var artistName = item.Item.Artists.FirstOrDefault()?.Name ?? "Unknown Artist";

            // Get the album image URL (prefer medium size ~300px, fallback to first available)
            var albumImageUrl = item.Item.Album?.Images
                .OrderBy(img => Math.Abs((img.Width ?? 300) - 300))
                .FirstOrDefault()?.Url;

            // Parse duration from milliseconds to "M:SS" format
            string? duration = null;
            if (item.Item.DurationMs.HasValue)
            {
                var totalSeconds = item.Item.DurationMs.Value / 1000;
                var minutes = totalSeconds / 60;
                var seconds = totalSeconds % 60;
                duration = $"{minutes}:{seconds:D2}";
            }

            // Parse year from release_date (format: "YYYY-MM-DD" or "YYYY")
            int? year = null;
            if (!string.IsNullOrEmpty(item.Item.Album?.ReleaseDate) && item.Item.Album.ReleaseDate.Length >= 4)
            {
                if (int.TryParse(item.Item.Album.ReleaseDate[..4], out var parsedYear))
                {
                    year = parsedYear;
                }
            }

            if (existingSong == null)
            {
                var newSong = new Song
                {
                    Id = Guid.NewGuid(),
                    SpotifyId = item.Item.Id,
                    Title = item.Item.Name,
                    Artist = artistName,
                    AlbumImageUrl = albumImageUrl,
                    Duration = duration,
                    Year = year,
                    PreviewUrl = item.Item.PreviewUrl,
                    PlaylistId = playlist.Id
                };
                _context.Songs.Add(newSong);
            }
            else
            {
                existingSong.Title = item.Item.Name;
                existingSong.Artist = artistName;
                existingSong.AlbumImageUrl = albumImageUrl;
                existingSong.Duration = duration;
                existingSong.Year = year;
                existingSong.PreviewUrl = item.Item.PreviewUrl;
            }
        }

        // Update TrackedPlaylist.LastSynced
        var trackedPlaylist = await _context.TrackedPlaylists
            .FirstOrDefaultAsync(tp => tp.SpotifyId == spotifyId);
        if (trackedPlaylist != null)
        {
            trackedPlaylist.LastSynced = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task SyncAllTrackedPlaylistsAsync()
    {
        var trackedPlaylists = await _context.TrackedPlaylists.ToListAsync();

        foreach (var tp in trackedPlaylists)
        {
            BackgroundJob.Enqueue<ISpotifyService>(s => s.SyncPlaylistAsync(tp.SpotifyId));
        }
    }

    public async Task<IEnumerable<SongWithPlaylistDto>> GetSongsAsync(string? playlistId = null)
    {
        var query = _context.Songs.Include(s => s.Playlist).AsQueryable();

        if (!string.IsNullOrEmpty(playlistId))
        {
            query = query.Where(s => s.Playlist != null && s.Playlist.SpotifyId == playlistId);
        }

        return await query.Select(s => new SongWithPlaylistDto
        {
            Id = s.Id,
            SpotifyId = s.SpotifyId,
            Title = s.Title,
            Artist = s.Artist,
            Duration = s.Duration,
            AlbumImageUrl = s.AlbumImageUrl,
            Year = s.Year,
            PlaylistId = s.PlaylistId,
            PlaylistName = s.Playlist != null ? s.Playlist.Name : string.Empty
        }).ToListAsync();
    }

    public async Task<string?> GetTrackPreviewUrlAsync(string spotifyId)
    {
        var token = await GetOrRefreshAccessTokenAsync();
        var url = $"https://api.spotify.com/v1/tracks/{spotifyId}?market=US";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode) return null;

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();

        // Try Spotify preview_url first (rarely available now)
        if (content.TryGetProperty("preview_url", out var previewUrl))
        {
            var spotifyPreview = previewUrl.GetString();
            if (!string.IsNullOrEmpty(spotifyPreview)) return spotifyPreview;
        }

        // Fallback: Get ISRC and query Deezer for preview
        if (content.TryGetProperty("external_ids", out var externalIds) &&
            externalIds.TryGetProperty("isrc", out var isrcElement))
        {
            var isrc = isrcElement.GetString();
            if (!string.IsNullOrEmpty(isrc))
            {
                return await GetDeezerPreviewByIsrcAsync(isrc);
            }
        }

        return null;
    }

    private async Task<string?> GetDeezerPreviewByIsrcAsync(string isrc)
    {
        try
        {
            var url = $"https://api.deezer.com/2.0/track/isrc:{isrc}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadFromJsonAsync<JsonElement>();

            // Check for error response from Deezer
            if (content.TryGetProperty("error", out _)) return null;

            if (content.TryGetProperty("preview", out var preview))
            {
                return preview.GetString();
            }
        }
        catch
        {
            // Silently fail - preview is optional
        }

        return null;
    }
}
