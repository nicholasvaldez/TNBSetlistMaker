using System.Text.Json.Serialization;

namespace TNBSetlistMaker.Bll.Dto;

public class SpotifyPlaylistDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("items")] 
    public SpotifyTracksContainer Items { get; set; } = new();}

public class SpotifyTracksContainer
{
    public List<SpotifyTrackItem> Items { get; set; } = new();
}

public class SpotifyTrackItem
{
    public SpotifyTrack Track { get; set; } = new();
}

public class SpotifyTrack
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<SpotifyArtist> Artists { get; set; } = new();
}

public class SpotifyArtist 
{ 
    public string Name { get; set; } = string.Empty; 
}