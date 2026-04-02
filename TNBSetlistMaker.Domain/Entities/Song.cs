namespace TNBSetlistMaker.Domain.Entities;

public class Song
{
    public Guid Id { get; set; }
    public string SpotifyId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? Duration { get; set; } // e.g., "3:45"
    
    // Relationship: Every song belongs to a playlist
    public Guid PlaylistId { get; set; }
    public Playlist? Playlist { get; set; }
}