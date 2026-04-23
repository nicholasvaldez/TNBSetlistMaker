namespace TNBSetlistMaker.Bll.Dto;

public class SetlistDto
{
    public string Code { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public string? EventDate { get; set; }
    public string ClientEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<SetlistEntryDto> Entries { get; set; } = new();
}

public class SetlistEntryDto
{
    public Guid SongId { get; set; }
    public string Rating { get; set; } = string.Empty;
    public List<string> MomentIds { get; set; } = new();
}
