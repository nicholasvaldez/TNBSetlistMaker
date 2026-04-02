namespace TNBSetlistMaker.Domain.Entities;

public class Playlist
{
    public Guid Id { get; set; }
    public string SpotifyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }

    // Relationship: A playlist contains many songs
    public ICollection<Song> Songs { get; set; } = new List<Song>();
}