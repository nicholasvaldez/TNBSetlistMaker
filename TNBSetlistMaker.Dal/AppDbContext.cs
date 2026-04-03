using Microsoft.EntityFrameworkCore;
using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Dal.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Playlist> Playlists => Set<Playlist>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<TrackedPlaylist> TrackedPlaylists => Set<TrackedPlaylist>();
    public DbSet<SpotifyToken> SpotifyTokens => Set<SpotifyToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Playlist>()
            .HasMany(p => p.Songs)
            .WithOne(s => s.Playlist)
            .HasForeignKey(s => s.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Song>()
            .HasIndex(s => s.SpotifyId)
            .IsUnique();
    }
}