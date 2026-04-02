public class TrackedPlaylist
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string SpotifyUrl { get; set; } = string.Empty;
    public DateTime? LastSynced { get; set; }
}