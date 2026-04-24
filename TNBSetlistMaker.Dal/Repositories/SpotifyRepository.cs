using Microsoft.EntityFrameworkCore;
using TNBSetlistMaker.Dal.Data;
using TNBSetlistMaker.Domain.Entities;
using TNBSetlistMaker.Domain.Interfaces;

namespace TNBSetlistMaker.Dal.Repositories;

public class SpotifyRepository : ISpotifyRepository
{
    private readonly AppDbContext _context;

    public SpotifyRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<SpotifyToken?> GetTokenAsync() =>
        _context.SpotifyTokens.FirstOrDefaultAsync();

    public async Task ReplaceTokenAsync(SpotifyToken token)
    {
        var existing = await _context.SpotifyTokens.ToListAsync();
        _context.SpotifyTokens.RemoveRange(existing);
        _context.SpotifyTokens.Add(token);
        await _context.SaveChangesAsync();
    }

    public Task<Playlist?> GetPlaylistWithSongsBySpotifyIdAsync(string spotifyId) =>
        _context.Playlists
            .Include(p => p.Songs)
            .FirstOrDefaultAsync(p => p.SpotifyId == spotifyId);

    public async Task AddPlaylistAsync(Playlist playlist) =>
        await _context.Playlists.AddAsync(playlist);

    public Task RemoveSongsAsync(IEnumerable<Song> songs)
    {
        _context.Songs.RemoveRange(songs);
        return Task.CompletedTask;
    }

    public async Task AddSongAsync(Song song) =>
        await _context.Songs.AddAsync(song);

    public Task<TrackedPlaylist?> GetTrackedPlaylistBySpotifyIdAsync(string spotifyId) =>
        _context.TrackedPlaylists.FirstOrDefaultAsync(tp => tp.SpotifyId == spotifyId);

    public async Task<IEnumerable<TrackedPlaylist>> GetAllTrackedPlaylistsAsync() =>
        await _context.TrackedPlaylists.ToListAsync();

    public async Task<IEnumerable<Song>> GetSongsWithPlaylistAsync(string? playlistSpotifyId = null)
    {
        var query = _context.Songs.Include(s => s.Playlist).AsQueryable();
        if (!string.IsNullOrEmpty(playlistSpotifyId))
            query = query.Where(s => s.Playlist != null && s.Playlist.SpotifyId == playlistSpotifyId);
        return await query.ToListAsync();
    }

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
