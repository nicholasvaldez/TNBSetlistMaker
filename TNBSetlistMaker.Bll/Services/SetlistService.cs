using Microsoft.EntityFrameworkCore;
using TNBSetlistMaker.Bll.Dto;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Dal.Data;
using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Bll.Services;

public class SetlistService : ISetlistService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly string _baseUrl;

    private static readonly char[] CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();

    public SetlistService(AppDbContext context, IEmailService emailService, string baseUrl)
    {
        _context = context;
        _emailService = emailService;
        _baseUrl = baseUrl;
    }

    public async Task<string> SubmitSetlistAsync(SubmitSetlistRequest request)
    {
        // Find existing setlist by client email (no entries loaded yet)
        var existing = await _context.Setlists
            .FirstOrDefaultAsync(s => s.ClientEmail == request.ClientEmail);

        string code;

        if (existing != null)
        {
            code = existing.Code;

            // Delete old entries via DB cascade (avoids stale EF tracker state)
            var oldEntries = await _context.SetlistEntries
                .Where(e => e.SetlistId == existing.Id)
                .ToListAsync();
            _context.SetlistEntries.RemoveRange(oldEntries);
            await _context.SaveChangesAsync();

            existing.EventName = request.EventName;
            existing.EventDate = ParseEventDate(request.EventDate);
            existing.SubmittedAt = DateTime.UtcNow;
            existing.Status = SetlistStatus.Submitted;
            existing.EditApprovalToken = null;

            AddEntries(existing, request.Entries);
        }
        else
        {
            code = await GenerateUniqueCodeAsync();
            var setlist = new Setlist
            {
                Id = Guid.NewGuid(),
                Code = code,
                EventName = request.EventName,
                EventDate = ParseEventDate(request.EventDate),
                ClientEmail = request.ClientEmail,
                SubmittedAt = DateTime.UtcNow,
                Status = SetlistStatus.Submitted,
            };

            AddEntries(setlist, request.Entries);
            _context.Setlists.Add(setlist);
        }

        await _context.SaveChangesAsync();

        // Send email to bandleader
        await _emailService.SendSetlistToLeaderAsync(
            request.EventName,
            request.EventDate,
            request.ClientEmail,
            code,
            request.PdfBase64);

        // Send confirmation to client
        await _emailService.SendClientConfirmationAsync(
            request.ClientEmail,
            request.EventName,
            code);

        return code;
    }

    public async Task<SetlistDto?> GetSetlistAsync(string code)
    {
        var setlist = await _context.Setlists
            .Include(s => s.Entries).ThenInclude(e => e.Moments)
            .FirstOrDefaultAsync(s => s.Code == code);

        if (setlist == null) return null;

        return new SetlistDto
        {
            Code = setlist.Code,
            EventName = setlist.EventName,
            EventDate = setlist.EventDate?.ToString("yyyy-MM-dd"),
            ClientEmail = setlist.ClientEmail,
            Status = setlist.Status.ToString(),
            Entries = setlist.Entries.Select(e => new SetlistEntryDto
            {
                SongId = e.SongId,
                Rating = e.Rating,
                MomentIds = e.Moments.Select(m => m.MomentId).ToList(),
            }).ToList(),
        };
    }

    public async Task RequestEditAsync(string code)
    {
        var setlist = await _context.Setlists.FirstOrDefaultAsync(s => s.Code == code);
        if (setlist == null) return;

        setlist.Status = SetlistStatus.EditRequested;
        setlist.EditApprovalToken = GenerateToken();
        await _context.SaveChangesAsync();

        var approvalLink = $"{_baseUrl}/api/setlist/{code}/approve-edit?token={setlist.EditApprovalToken}";
        await _emailService.SendEditRequestToLeaderAsync(setlist.EventName, code, approvalLink);
    }

    public async Task<bool> ApproveEditAsync(string code, string token)
    {
        var setlist = await _context.Setlists.FirstOrDefaultAsync(s => s.Code == code);
        if (setlist == null || setlist.EditApprovalToken != token) return false;

        setlist.Status = SetlistStatus.EditApproved;
        setlist.EditApprovalToken = null;
        await _context.SaveChangesAsync();
        return true;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static void AddEntries(Setlist setlist, List<SetlistEntryRequest> entryRequests)
    {
        foreach (var er in entryRequests)
        {
            var entry = new SetlistEntry
            {
                Id = Guid.NewGuid(),
                SetlistId = setlist.Id,
                SongId = er.SongId,
                Rating = er.Rating,
                Moments = er.MomentIds.Select(mid => new SetlistEntryMoment
                {
                    Id = Guid.NewGuid(),
                    MomentId = mid,
                }).ToList(),
            };
            setlist.Entries.Add(entry);
        }
    }

    private async Task<string> GenerateUniqueCodeAsync()
    {
        var rng = Random.Shared;
        string code;
        do
        {
            var suffix = new string(Enumerable.Range(0, 4).Select(_ => CodeChars[rng.Next(CodeChars.Length)]).ToArray());
            code = $"TNB-{suffix}";
        } while (await _context.Setlists.AnyAsync(s => s.Code == code));

        return code;
    }

    private static string GenerateToken() =>
        Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');

    private static DateOnly? ParseEventDate(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return null;
        return DateOnly.TryParse(dateStr, out var d) ? d : null;
    }
}
