using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Dal.Data;
using TNBSetlistMaker.Domain.Entities;
using TNBSetlistMaker.Web.Filters;

namespace TNBSetlistMaker.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpotifyController : ControllerBase
{
    private readonly ISpotifyService _spotifyService;
    private readonly AppDbContext _context;

    public SpotifyController(ISpotifyService spotifyService, AppDbContext context)
    {
        _spotifyService = spotifyService;
        _context = context;
    }

    [AdminApiKey]
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var token = await _context.SpotifyTokens.FirstOrDefaultAsync();
        var trackedCount = await _context.TrackedPlaylists.CountAsync();
        return Ok(new
        {
            connected = token != null,
            lastRefreshed = token?.UpdatedAt,
            trackedPlaylists = trackedCount,
        });
    }

    [AdminApiKey]
    [HttpGet("playlist/{playlistId}")]
    public async Task<IActionResult> GetPlaylist(string playlistId)
    {
        try
        {
            if (string.IsNullOrEmpty(playlistId)) return BadRequest("Playlist ID is required.");

            var playlist = await _spotifyService.GetPlaylistAsync(playlistId);
            return Ok(playlist);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AdminApiKey]
    [HttpPost("sync-all")]
    public async Task<IActionResult> SyncAll()
    {
        await _spotifyService.SyncAllTrackedPlaylistsAsync();
        return Ok(new { message = "Sync jobs enqueued" });
    }

    [HttpGet("songs")]
    public async Task<IActionResult> GetSongs([FromQuery] string? playlistId = null)
    {
        var songs = await _spotifyService.GetSongsAsync(playlistId);
        return Ok(songs);
    }

    [HttpGet("tracks/{spotifyId}/preview")]
    public async Task<IActionResult> GetTrackPreview(string spotifyId)
    {
        var previewUrl = await _spotifyService.GetTrackPreviewUrlAsync(spotifyId);
        return Ok(new { previewUrl });
    }

    [AdminApiKey]
    [HttpGet("playlists/tracked")]
    public async Task<IActionResult> GetTrackedPlaylists()
    {
        var playlists = await _context.TrackedPlaylists.ToListAsync();
        return Ok(playlists);
    }

    [AdminApiKey]
    [HttpPost("playlists/track")]
    public async Task<IActionResult> TrackPlaylist([FromBody] TrackPlaylistRequest request)
    {
        if (string.IsNullOrEmpty(request.SpotifyId))
            return BadRequest(new { message = "SpotifyId is required" });

        var existing = await _context.TrackedPlaylists
            .FirstOrDefaultAsync(p => p.SpotifyId == request.SpotifyId);

        if (existing != null)
            return Ok(new { message = "Playlist already tracked", playlist = existing });

        var playlist = new TrackedPlaylist
        {
            SpotifyId = request.SpotifyId,
            Name = request.Name ?? request.SpotifyId
        };

        _context.TrackedPlaylists.Add(playlist);
        await _context.SaveChangesAsync();

        await _spotifyService.SyncPlaylistAsync(request.SpotifyId);

        return Ok(new { message = "Playlist tracked and synced", playlist });
    }
}

public record TrackPlaylistRequest(string SpotifyId, string? Name = null);