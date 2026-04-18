using System.Text.Json.Serialization;

namespace TNBSetlistMaker.Bll.Dto;

public class SpotifyTracksResponseDto
{
    [JsonPropertyName("items")]
    public List<SpotifyTrackItem> Items { get; set; } = new();

    [JsonPropertyName("next")]
    public string? Next { get; set; }
}

public class SpotifyTrackItem
{
    [JsonPropertyName("item")]
    public SpotifyTrackDetails Item { get; set; } = new();
}

public class SpotifyTrackDetails
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("artists")]
    public List<SpotifyArtistDto> Artists { get; set; } = new();

    [JsonPropertyName("album")]
    public SpotifyAlbumDto? Album { get; set; }

    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }

    [JsonPropertyName("preview_url")]
    public string? PreviewUrl { get; set; }
}

public class SpotifyArtistDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class SpotifyAlbumDto
{
    [JsonPropertyName("images")]
    public List<SpotifyImageDto> Images { get; set; } = new();

    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }
}

public class SpotifyImageDto
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("width")]
    public int? Width { get; set; }

    [JsonPropertyName("height")]
    public int? Height { get; set; }
}