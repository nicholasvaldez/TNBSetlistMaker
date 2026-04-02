using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore; 
using Hangfire;
using TNBSetlistMaker.Bll.Dto;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Domain.Entities;
using TNBSetlistMaker.Dal.Data; 

namespace TNBSetlistMaker.Bll.Services;

public class SpotifyService : ISpotifyService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly AppDbContext _context; 
    public SpotifyService(HttpClient httpClient, IConfiguration config, AppDbContext context)
    {
        _httpClient = httpClient;
        _config = config;
        _context = context;
    }

    public async Task<Playlist> GetPlaylistByUrlAsync(string url)
    {
        var playlistId = ExtractPlaylistId(url);
        var token = await GetAccessTokenAsync();

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        
        var spotifyData = await _httpClient.GetFromJsonAsync<SpotifyPlaylistDto>($"https://api.spotify.com/v1/playlists/{playlistId}");

        if (spotifyData == null) throw new Exception("Could not fetch playlist from Spotify.");

        return new Playlist
        {
            SpotifyId = spotifyData.Id,
            Name = spotifyData.Name,
            Songs = spotifyData.Tracks.Items.Select(item => new Song
            {
                SpotifyId = item.Track.Id,
                Title = item.Track.Name,
                Artist = string.Join(", ", item.Track.Artists.Select(a => a.Name))
            }).ToList()
        };
    }

    public async Task SyncAllTrackedPlaylistsAsync()
    {
        var tracked = await _context.TrackedPlaylists.ToListAsync();

        foreach (var playlist in tracked)
        {
            // Hangfire enqueues this for background processing
            BackgroundJob.Enqueue<ISpotifyService>(service => 
                service.SyncPlaylistAsync(playlist.SpotifyUrl));
            
            playlist.LastSynced = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<Playlist> SyncPlaylistAsync(string url)
    {
        var spotifyPlaylist = await GetPlaylistByUrlAsync(url);

        var existingPlaylist = await _context.Playlists
            .Include(p => p.Songs)
            .FirstOrDefaultAsync(p => p.SpotifyId == spotifyPlaylist.SpotifyId);

        if (existingPlaylist == null)
        {
            _context.Playlists.Add(spotifyPlaylist);
            await _context.SaveChangesAsync();
            return spotifyPlaylist;
        }

        existingPlaylist.Name = spotifyPlaylist.Name;

        foreach (var incomingSong in spotifyPlaylist.Songs)
        {
            var existingSong = existingPlaylist.Songs
                .FirstOrDefault(s => s.SpotifyId == incomingSong.SpotifyId);

            if (existingSong == null)
            {
                incomingSong.PlaylistId = existingPlaylist.Id;
                existingPlaylist.Songs.Add(incomingSong);
            }
            else
            {
                existingSong.Title = incomingSong.Title;
                existingSong.Artist = incomingSong.Artist;
            }
        }

        await _context.SaveChangesAsync();
        return existingPlaylist;
    }

    public async Task<string> GetAccessTokenAsync()
    {
        var clientId = _config["Spotify:ClientId"];
        var clientSecret = _config["Spotify:ClientSecret"];

        // 2026 Endpoint Update
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

    private string ExtractPlaylistId(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) 
            throw new ArgumentException("Playlist URL cannot be empty.");

        // This regex looks for 'playlist/' and captures everything up to the next '?' or '/'
        var match = Regex.Match(url, @"playlist/([^?/\s]+)");
        
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        throw new ArgumentException("The provided URL is not a valid Spotify playlist link.");
    }
}