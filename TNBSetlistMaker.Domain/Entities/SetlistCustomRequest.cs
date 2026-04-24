namespace TNBSetlistMaker.Domain.Entities;

public class SetlistCustomRequest
{
    public Guid Id { get; set; }
    public Guid SetlistId { get; set; }
    public Setlist Setlist { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string? MomentId { get; set; }
    public string? Note { get; set; }
    public int Order { get; set; }
}
