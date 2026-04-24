namespace TNBSetlistMaker.Bll.Dto;

public class SubmitSetlistRequest
{
    public string EventName { get; set; } = string.Empty;
    public string? EventDate { get; set; } // ISO string "YYYY-MM-DD", optional
    public string ClientEmail { get; set; } = string.Empty;
    public List<SetlistEntryRequest> Entries { get; set; } = new();
    public List<CustomRequestDto> CustomRequests { get; set; } = new();
    public string PdfBase64 { get; set; } = string.Empty; // base64-encoded PDF from @react-pdf/renderer
}

public class SetlistEntryRequest
{
    public Guid SongId { get; set; }
    public string Rating { get; set; } = string.Empty; // "must" | "maybe" | "skip"
    public List<string> MomentIds { get; set; } = new();
}
