using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Web;
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
        var fields = "items(item(id,name,artists(name))),next";
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
}
