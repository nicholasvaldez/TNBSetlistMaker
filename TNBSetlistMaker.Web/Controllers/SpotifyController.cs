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
}