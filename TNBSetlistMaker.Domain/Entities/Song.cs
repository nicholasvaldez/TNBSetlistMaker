namespace TNBSetlistMaker.Domain.Entities;

public class Song
{
    public Guid Id { get; set; }
    public string SpotifyId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? Duration { get; set; } // e.g., "3:45"
    public string? AlbumImageUrl { get; set; }
    public int? Year { get; set; }
    public string? PreviewUrl { get; set; }

    // Relationship: Every song belongs to a playlist
    public Guid PlaylistId { get; set; }
    public Playlist? Playlist { get; set; }
}