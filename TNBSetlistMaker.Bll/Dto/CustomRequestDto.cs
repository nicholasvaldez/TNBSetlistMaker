namespace TNBSetlistMaker.Bll.Dto;

public class CustomRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string? MomentId { get; set; }
    public string? Note { get; set; }
}
