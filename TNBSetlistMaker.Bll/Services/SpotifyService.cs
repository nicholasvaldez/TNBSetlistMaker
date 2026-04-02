using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using TNBSetlistMaker.Bll.Dto;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Bll.Services;

public class SpotifyService : ISpotifyService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;

    public SpotifyService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
    }

    public async Task<string> GetAccessTokenAsync()
    {
        var clientId = _config["Spotify:ClientId"];
        var clientSecret = _config["Spotify:ClientSecret"];

        var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
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

    public async Task<Playlist> GetPlaylistByUrlAsync(string url)
    {
        var playlistId = ExtractPlaylistId(url);
        var token = await GetAccessTokenAsync();

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        
        var spotifyData = await _httpClient.GetFromJsonAsync<SpotifyPlaylistDto>($"https://api.spotify.com/v1/playlists/{playlistId}");

        if (spotifyData == null) throw new Exception("Could not fetch playlist from Spotify.");

        // Mapping DTO -> Domain Entity
        return new Playlist
        {
            SpotifyId = spotifyData.Id,
            Name = spotifyData.Name,
            Songs = spotifyData.Items.Items.Select(item => new Song
            {
                SpotifyId = item.Track.Id,
                Title = item.Track.Name,
                Artist = string.Join(", ", item.Track.Artists.Select(a => a.Name)),
                // We'll add BPM/Key fetching in a separate pass since they require extra API hits
            }).ToList()
        };
    }

    private string ExtractPlaylistId(string url)
    {
        // Regex to grab the ID from a Spotify URL
        var match = Regex.Match(url, @"playlist/([^?/\s]+)");
        return match.Success ? match.Groups[1].Value : throw new ArgumentException("Invalid Spotify URL");
    }
}