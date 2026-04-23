using Microsoft.AspNetCore.Mvc;
using TNBSetlistMaker.Bll.Dto;
using TNBSetlistMaker.Bll.Interfaces;

namespace TNBSetlistMaker.Web.Controllers;

[ApiController]
[Route("api/setlist")]
public class SetlistController : ControllerBase
{
    private readonly ISetlistService _setlistService;
    private readonly string _frontendUrl;

    public SetlistController(ISetlistService setlistService, IConfiguration config)
    {
        _setlistService = setlistService;
        _frontendUrl = config["App:FrontendUrl"] ?? "http://localhost:5173";
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitSetlistRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EventName))
            return BadRequest(new { message = "EventName is required." });
        if (string.IsNullOrWhiteSpace(request.ClientEmail))
            return BadRequest(new { message = "ClientEmail is required." });
        if (request.Entries.Count == 0)
            return BadRequest(new { message = "At least one entry is required." });

        var code = await _setlistService.SubmitSetlistAsync(request);
        return Ok(new { code });
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetSetlist(string code)
    {
        var setlist = await _setlistService.GetSetlistAsync(code);
        if (setlist == null) return NotFound(new { message = "Setlist not found." });
        return Ok(setlist);
    }

    [HttpPost("{code}/request-edit")]
    public async Task<IActionResult> RequestEdit(string code)
    {
        await _setlistService.RequestEditAsync(code);
        return Ok(new { message = "Edit request sent." });
    }

    [HttpGet("{code}/approve-edit")]
    public async Task<IActionResult> ApproveEdit(string code, [FromQuery] string token)
    {
        var approved = await _setlistService.ApproveEditAsync(code, token);
        if (!approved) return BadRequest(new { message = "Invalid or expired approval link." });

        // Redirect to the frontend with a success param so the UI can update state
        return Redirect($"{_frontendUrl}/?editApproved={code}");
    }
}
