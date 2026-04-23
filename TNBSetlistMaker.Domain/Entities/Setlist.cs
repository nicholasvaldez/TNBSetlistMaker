namespace TNBSetlistMaker.Domain.Entities;

public class Setlist
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty; // e.g. TNB-4A2B
    public string EventName { get; set; } = string.Empty;
    public DateOnly? EventDate { get; set; }
    public string ClientEmail { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public SetlistStatus Status { get; set; } = SetlistStatus.Submitted;
    public string? EditApprovalToken { get; set; }

    public ICollection<SetlistEntry> Entries { get; set; } = new List<SetlistEntry>();
}
