namespace TNBSetlistMaker.Domain.Entities;

public class SetlistEntry
{
    public Guid Id { get; set; }
    public Guid SetlistId { get; set; }
    public Setlist Setlist { get; set; } = null!;
    public Guid SongId { get; set; }
    public Song Song { get; set; } = null!;
    public string Rating { get; set; } = string.Empty; // "must" | "maybe" | "skip"

    public ICollection<SetlistEntryMoment> Moments { get; set; } = new List<SetlistEntryMoment>();
}
