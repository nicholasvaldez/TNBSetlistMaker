namespace TNBSetlistMaker.Bll.Dto;

public class SongWithPlaylistDto
{
    public Guid Id { get; set; }
    public string SpotifyId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? Duration { get; set; }
    public string? AlbumImageUrl { get; set; }
    public int? Year { get; set; }
    public Guid PlaylistId { get; set; }
    public string PlaylistName { get; set; } = string.Empty;
}
