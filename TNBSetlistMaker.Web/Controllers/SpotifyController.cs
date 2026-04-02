using Microsoft.AspNetCore.Mvc;
using TNBSetlistMaker.Bll.Interfaces;

namespace TNBSetlistMaker.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpotifyController : ControllerBase
{
    private readonly ISpotifyService _spotifyService;

    public SpotifyController(ISpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("playlist")]
    public async Task<IActionResult> GetPlaylist([FromQuery] string url)
    {
        try
        {
            if (string.IsNullOrEmpty(url)) return BadRequest("URL is required.");
            
            var playlist = await _spotifyService.GetPlaylistByUrlAsync(url);
            return Ok(playlist);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sync-all")]
    public async Task<IActionResult> SyncAll()
    {
        await _spotifyService.SyncAllTrackedPlaylistsAsync();
        
        return Accepted(new { 
            message = "Sync jobs enqueued. Monitoring available in Hangfire Dashboard." 
        });
    }
}