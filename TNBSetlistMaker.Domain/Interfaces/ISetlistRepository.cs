using TNBSetlistMaker.Domain.Entities;

namespace TNBSetlistMaker.Domain.Interfaces;

public interface ISetlistRepository
{
    Task AddEntriesDirectAsync(List<SetlistEntry> entries);
    Task AddCustomRequestsDirectAsync(List<SetlistCustomRequest> requests);
    Task<Setlist?> FindByEmailAsync(string email);
    Task<Setlist?> FindByCodeAsync(string code);
    Task<Setlist?> FindByCodeWithDetailsAsync(string code);
    Task AddAsync(Setlist setlist);
    Task DeleteChildrenBySetlistIdAsync(Guid setlistId);
    Task<bool> IsCodeTakenAsync(string code);
    Task SaveChangesAsync();
    void DetachAll();
}
