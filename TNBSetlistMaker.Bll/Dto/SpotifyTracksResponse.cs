using System.Text.Json.Serialization;

namespace TNBSetlistMaker.Bll.Dto;

public class SpotifyTracksResponseDto
{
    public List<SpotifyTrackItem> Items { get; set; } = new();
    public string? Next { get; set; }
}

public class SpotifyTrackItem
{
    [JsonPropertyName("item")]
    public SpotifyTrackDetails Item { get; set; } = new();
}

public class SpotifyTrackDetails
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<SpotifyArtistDto> Artists { get; set; } = new();
}

public class SpotifyArtistDto
{
    public string Name { get; set; } = string.Empty;
}