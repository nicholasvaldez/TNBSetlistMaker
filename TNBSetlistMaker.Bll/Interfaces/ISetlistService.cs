using TNBSetlistMaker.Bll.Dto;

namespace TNBSetlistMaker.Bll.Interfaces;

public interface ISetlistService
{
    Task<string> SubmitSetlistAsync(SubmitSetlistRequest request);
    Task<SetlistDto?> GetSetlistAsync(string code);
    Task RequestEditAsync(string code);
    Task<bool> ApproveEditAsync(string code, string token);
}
