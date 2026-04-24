using Microsoft.EntityFrameworkCore;
using TNBSetlistMaker.Dal.Data;
using TNBSetlistMaker.Domain.Entities;
using TNBSetlistMaker.Domain.Interfaces;

namespace TNBSetlistMaker.Dal.Repositories;

public class SetlistRepository : ISetlistRepository
{
    private readonly AppDbContext _context;

    public SetlistRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddEntriesDirectAsync(List<SetlistEntry> entries)
    {
        await _context.SetlistEntries.AddRangeAsync(entries);
    }

    public async Task AddCustomRequestsDirectAsync(List<SetlistCustomRequest> requests)
    {
        await _context.SetlistCustomRequests.AddRangeAsync(requests);
    }

    public Task<Setlist?> FindByEmailAsync(string email) =>
        _context.Setlists.FirstOrDefaultAsync(s => s.ClientEmail == email);

    public Task<Setlist?> FindByCodeAsync(string code) =>
        _context.Setlists.FirstOrDefaultAsync(s => s.Code == code);

    public Task<Setlist?> FindByCodeWithDetailsAsync(string code) =>
        _context.Setlists
            .Include(s => s.Entries).ThenInclude(e => e.Moments)
            .Include(s => s.CustomRequests)
            .FirstOrDefaultAsync(s => s.Code == code);

    public async Task AddAsync(Setlist setlist) =>
        await _context.Setlists.AddAsync(setlist);

    public async Task DeleteChildrenBySetlistIdAsync(Guid setlistId)
    {
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $@"DELETE FROM ""SetlistEntryMoments"" WHERE ""SetlistEntryId"" IN (SELECT ""Id"" FROM ""SetlistEntries"" WHERE ""SetlistId"" = {setlistId})");
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $@"DELETE FROM ""SetlistCustomRequests"" WHERE ""SetlistId"" = {setlistId}");
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $@"DELETE FROM ""SetlistEntries"" WHERE ""SetlistId"" = {setlistId}");
    }

    public Task<bool> IsCodeTakenAsync(string code) =>
        _context.Setlists.AnyAsync(s => s.Code == code);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();

    public void DetachAll()
    {
        _context.ChangeTracker.Clear();
    }
}
