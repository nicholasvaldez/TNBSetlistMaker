using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using TNBSetlistMaker.Bll.Interfaces;

namespace TNBSetlistMaker.Bll.Services;

public class SendGridEmailService : IEmailService
{
    private readonly SendGridClient _client;
    private readonly ILogger<SendGridEmailService> _logger;
    private const string BandleaderEmail = "nickvee2012@gmail.com";
    private const string FromEmail = "nickvee2012@gmail.com";
    private const string FromName = "The Nashville Band · Song Curator";

    public SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger)
    {
        var apiKey = (config["SendGrid:ApiKey"]
            ?? throw new InvalidOperationException("SendGrid:ApiKey is not configured.")).Trim();
        _client = new SendGridClient(apiKey);
        _logger = logger;
    }

    public async Task SendSetlistToLeaderAsync(
        string eventName,
        string? eventDate,
        string clientEmail,
        string setlistCode,
        string pdfBase64)
    {
        var msg = new SendGridMessage
        {
            From = new EmailAddress(FromEmail, FromName),
            Subject = $"🎵 New Setlist Submission — {eventName} [{setlistCode}]",
            HtmlContent = BuildLeaderHtml(eventName, eventDate, clientEmail, setlistCode),
        };
        msg.AddTo(new EmailAddress(BandleaderEmail));

        if (!string.IsNullOrEmpty(pdfBase64))
        {
            msg.AddAttachment(
                $"setlist-{setlistCode}.pdf",
                pdfBase64,
                "application/pdf");
        }

        var r1 = await _client.SendEmailAsync(msg);
        _logger.LogInformation("Leader email status: {Status}", r1.StatusCode);
    }

    public async Task SendClientConfirmationAsync(
        string clientEmail,
        string eventName,
        string setlistCode)
    {
        var msg = new SendGridMessage
        {
            From = new EmailAddress(FromEmail, FromName),
            Subject = $"Your setlist picks have been sent — {setlistCode}",
            HtmlContent = BuildClientHtml(eventName, setlistCode),
        };
        msg.AddTo(new EmailAddress(clientEmail));

        var r2 = await _client.SendEmailAsync(msg);
        _logger.LogInformation("Client email status: {Status}", r2.StatusCode);
    }

    public async Task SendEditRequestToLeaderAsync(
        string eventName,
        string setlistCode,
        string approvalLink)
    {
        var msg = new SendGridMessage
        {
            From = new EmailAddress(FromEmail, FromName),
            Subject = $"Edit request — {eventName} [{setlistCode}]",
            HtmlContent = BuildEditRequestHtml(eventName, setlistCode, approvalLink),
        };
        msg.AddTo(new EmailAddress(BandleaderEmail));

        var r3 = await _client.SendEmailAsync(msg);
        _logger.LogInformation("Edit request email status: {Status}", r3.StatusCode);
    }

    // ── HTML templates ──────────────────────────────────────────────────────

    private static string BuildLeaderHtml(string eventName, string? eventDate, string clientEmail, string code) => $"""
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;color:#1a1a1a;">
          <h1 style="font-size:28px;font-weight:600;margin-bottom:4px;">New Setlist Submission</h1>
          <p style="color:#666;margin-top:0;font-size:14px;">The Nashville Band · Song Curator</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
          <table style="width:100%;font-size:15px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;width:130px;">Event</td><td><strong>{System.Web.HttpUtility.HtmlEncode(eventName)}</strong></td></tr>
            {(string.IsNullOrEmpty(eventDate) ? "" : $"<tr><td style='padding:6px 0;color:#888;'>Date</td><td>{System.Web.HttpUtility.HtmlEncode(eventDate)}</td></tr>")}
            <tr><td style="padding:6px 0;color:#888;">Client email</td><td>{System.Web.HttpUtility.HtmlEncode(clientEmail)}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Reference</td><td><strong style="letter-spacing:1px;">{code}</strong></td></tr>
          </table>
          <p style="margin-top:24px;font-size:14px;color:#555;">The full setlist is attached as a PDF.</p>
        </div>
        """;

    private static string BuildClientHtml(string eventName, string code) => $"""
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;color:#1a1a1a;">
          <h1 style="font-size:28px;font-weight:600;margin-bottom:4px;">Your picks are in!</h1>
          <p style="color:#666;margin-top:0;font-size:14px;">The Nashville Band · Song Curator</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
          <p style="font-size:15px;">Thank you for submitting your song preferences for <strong>{System.Web.HttpUtility.HtmlEncode(eventName)}</strong>. We'll review your picks and be in touch soon.</p>
          <p style="font-size:15px;">Keep this email safe — you'll need your reference code if you ever need to make changes:</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
            <span style="font-size:28px;font-weight:700;letter-spacing:4px;font-family:monospace;">{code}</span>
          </div>
          <p style="font-size:13px;color:#888;">If you need to edit your selections, visit the Song Curator and use this code to restore your session.</p>
        </div>
        """;

    private static string BuildEditRequestHtml(string eventName, string code, string approvalLink) => $"""
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;color:#1a1a1a;">
          <h1 style="font-size:28px;font-weight:600;margin-bottom:4px;">Edit Request</h1>
          <p style="color:#666;margin-top:0;font-size:14px;">The Nashville Band · Song Curator</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
          <p style="font-size:15px;"><strong>{System.Web.HttpUtility.HtmlEncode(eventName)}</strong> ({code}) is requesting permission to edit their setlist submission.</p>
          <p style="font-size:15px;">Click below to approve:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{approvalLink}" style="background:#1a1a1a;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">Approve Edit Request</a>
          </div>
          <p style="font-size:13px;color:#888;">This link is single-use and will expire once clicked.</p>
        </div>
        """;
}
