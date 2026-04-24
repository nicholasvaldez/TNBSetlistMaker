using TNBSetlistMaker.Bll.Dto;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Domain.Entities;
using TNBSetlistMaker.Domain.Interfaces;

namespace TNBSetlistMaker.Bll.Services;

public class SetlistService : ISetlistService
{
    private readonly ISetlistRepository _repo;
    private readonly IEmailService _emailService;
    private readonly string _baseUrl;
    private readonly string _frontendUrl;

    private static readonly char[] CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();

    public SetlistService(ISetlistRepository repo, IEmailService emailService, string baseUrl, string frontendUrl)
    {
        _repo = repo;
        _emailService = emailService;
        _baseUrl = baseUrl;
        _frontendUrl = frontendUrl;
    }

    public async Task<string> SubmitSetlistAsync(SubmitSetlistRequest request)
    {
        var existing = await _repo.FindByEmailAsync(request.ClientEmail);

        string code;

        if (existing != null)
        {
            code = existing.Code;
            var setlistId = existing.Id;

            await _repo.DeleteChildrenBySetlistIdAsync(setlistId);
            _repo.DetachAll();

            existing = await _repo.FindByEmailAsync(request.ClientEmail);
            existing.EventName = request.EventName;
            existing.EventDate = ParseEventDate(request.EventDate);
            existing.SubmittedAt = DateTime.UtcNow;
            existing.Status = SetlistStatus.Submitted;
            existing.EditApprovalToken = null;
            await _repo.SaveChangesAsync();

            _repo.DetachAll();

            var newEntries = request.Entries.Select(er => new SetlistEntry
            {
                Id = Guid.NewGuid(),
                SetlistId = setlistId,
                SongId = er.SongId,
                Rating = er.Rating,
                Moments = er.MomentIds.Select(mid => new SetlistEntryMoment
                {
                    Id = Guid.NewGuid(),
                    MomentId = mid,
                }).ToList(),
            }).ToList();

            var valid = request.CustomRequests
                .Where(r => !string.IsNullOrWhiteSpace(r.Title) && !string.IsNullOrWhiteSpace(r.Artist))
                .Take(5)
                .ToList();
            var newRequests = valid.Select((r, i) => new SetlistCustomRequest
            {
                Id = Guid.NewGuid(),
                SetlistId = setlistId,
                Title = r.Title.Trim(),
                Artist = r.Artist.Trim(),
                LinkUrl = string.IsNullOrWhiteSpace(r.LinkUrl) ? null : r.LinkUrl.Trim(),
                MomentId = string.IsNullOrWhiteSpace(r.MomentId) ? null : r.MomentId.Trim(),
                Note = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim(),
                Order = i,
            }).ToList();

            await _repo.AddEntriesDirectAsync(newEntries);
            await _repo.AddCustomRequestsDirectAsync(newRequests);
            await _repo.SaveChangesAsync();
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
            AddCustomRequests(setlist, request.CustomRequests);
            await _repo.AddAsync(setlist);
        }

        await _repo.SaveChangesAsync();

        await _emailService.SendSetlistToLeaderAsync(
            request.EventName,
            request.EventDate,
            request.ClientEmail,
            code,
            request.PdfBase64);

        await _emailService.SendClientConfirmationAsync(
            request.ClientEmail,
            request.EventName,
            code);

        return code;
    }

    public async Task<SetlistDto?> GetSetlistAsync(string code)
    {
        var setlist = await _repo.FindByCodeWithDetailsAsync(code);

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
            CustomRequests = setlist.CustomRequests.OrderBy(r => r.Order).Select(r => new CustomRequestDto
            {
                Title = r.Title,
                Artist = r.Artist,
                LinkUrl = r.LinkUrl,
                MomentId = r.MomentId,
                Note = r.Note,
            }).ToList(),
        };
    }

    public async Task RequestEditAsync(string code)
    {
        var setlist = await _repo.FindByCodeAsync(code);
        if (setlist == null) return;

        setlist.Status = SetlistStatus.EditRequested;
        setlist.EditApprovalToken = GenerateToken();
        await _repo.SaveChangesAsync();

        var approvalLink = $"{_baseUrl}/api/setlist/{code}/approve-edit?token={setlist.EditApprovalToken}";
        await _emailService.SendEditRequestToLeaderAsync(setlist.EventName, code, approvalLink);
    }

    public async Task<bool> ApproveEditAsync(string code, string token)
    {
        var setlist = await _repo.FindByCodeAsync(code);
        if (setlist == null || setlist.EditApprovalToken != token) return false;

        setlist.Status = SetlistStatus.EditApproved;
        setlist.EditApprovalToken = null;
        await _repo.SaveChangesAsync();

        var editLink = $"{_frontendUrl}/?editApproved={code}";
        await _emailService.SendEditApprovedToClientAsync(
            setlist.ClientEmail, setlist.EventName, code, editLink);

        return true;
    }

    private static void AddCustomRequests(Setlist setlist, List<CustomRequestDto> requests)
    {
        var valid = requests
            .Where(r => !string.IsNullOrWhiteSpace(r.Title) && !string.IsNullOrWhiteSpace(r.Artist))
            .Take(5)
            .ToList();

        for (int i = 0; i < valid.Count; i++)
        {
            var r = valid[i];
            setlist.CustomRequests.Add(new SetlistCustomRequest
            {
                Id = Guid.NewGuid(),
                SetlistId = setlist.Id,
                Title = r.Title.Trim(),
                Artist = r.Artist.Trim(),
                LinkUrl = string.IsNullOrWhiteSpace(r.LinkUrl) ? null : r.LinkUrl.Trim(),
                MomentId = string.IsNullOrWhiteSpace(r.MomentId) ? null : r.MomentId.Trim(),
                Note = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim(),
                Order = i,
            });
        }
    }

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
        } while (await _repo.IsCodeTakenAsync(code));

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
