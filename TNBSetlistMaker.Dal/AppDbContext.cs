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
    public DbSet<Setlist> Setlists => Set<Setlist>();
    public DbSet<SetlistEntry> SetlistEntries => Set<SetlistEntry>();
    public DbSet<SetlistEntryMoment> SetlistEntryMoments => Set<SetlistEntryMoment>();
    public DbSet<SetlistCustomRequest> SetlistCustomRequests => Set<SetlistCustomRequest>();

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

        modelBuilder.Entity<Setlist>()
            .HasIndex(s => s.Code)
            .IsUnique();

        modelBuilder.Entity<Setlist>()
            .HasMany(s => s.Entries)
            .WithOne(e => e.Setlist)
            .HasForeignKey(e => e.SetlistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SetlistEntry>()
            .HasOne(e => e.Song)
            .WithMany()
            .HasForeignKey(e => e.SongId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SetlistEntry>()
            .HasMany(e => e.Moments)
            .WithOne(m => m.SetlistEntry)
            .HasForeignKey(m => m.SetlistEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Setlist>()
            .HasMany(s => s.CustomRequests)
            .WithOne(r => r.Setlist)
            .HasForeignKey(r => r.SetlistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}