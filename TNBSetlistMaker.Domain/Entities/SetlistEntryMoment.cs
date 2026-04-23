namespace TNBSetlistMaker.Domain.Entities;

public class SetlistEntryMoment
{
    public Guid Id { get; set; }
    public Guid SetlistEntryId { get; set; }
    public SetlistEntry SetlistEntry { get; set; } = null!;
    public string MomentId { get; set; } = string.Empty; // e.g. "firstdance", "processional"
}
