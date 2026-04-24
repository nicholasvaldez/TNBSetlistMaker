namespace TNBSetlistMaker.Bll.Interfaces;

public interface IEmailService
{
    Task SendSetlistToLeaderAsync(
        string eventName,
        string? eventDate,
        string clientEmail,
        string setlistCode,
        string pdfBase64);

    Task SendClientConfirmationAsync(
        string clientEmail,
        string eventName,
        string setlistCode);

    Task SendEditRequestToLeaderAsync(
        string eventName,
        string setlistCode,
        string approvalLink);

    Task SendEditApprovedToClientAsync(
        string clientEmail,
        string eventName,
        string setlistCode,
        string editLink);
}
