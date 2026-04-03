using Microsoft.AspNetCore.Mvc;
using TNBSetlistMaker.Bll.Interfaces;

namespace TNBSetlistMaker.Web.Controllers;

[ApiController]
[Route("api/spotify")]
public class SpotifyAuthController : ControllerBase
{
    private readonly ISpotifyService _spotifyService;

    public SpotifyAuthController(ISpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        var authUrl = _spotifyService.GetAuthorizationUrl();
        return Redirect(authUrl);
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(new { message = $"Spotify authorization failed: {error}" });
        }

        if (string.IsNullOrEmpty(code))
        {
            return BadRequest(new { message = "No authorization code received from Spotify" });
        }

        try
        {
            await _spotifyService.ExchangeCodeForTokensAsync(code);
            return Ok(new { message = "Spotify authentication successful! Token stored." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to exchange code for tokens: {ex.Message}" });
        }
    }
}
