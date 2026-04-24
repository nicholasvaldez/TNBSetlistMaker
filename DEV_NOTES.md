# Dev Notes

## New Machine Setup

```bash
git pull
dotnet ef database update --project TNBSetlistMaker.Dal --startup-project TNBSetlistMaker.Web
cd TNBSetlistMaker.UI && npm install
```

## Running the App

```bash
# Backend
dotnet run --project TNBSetlistMaker.Web

# Frontend (new terminal)
cd TNBSetlistMaker.UI && npm run dev:localhost
```

## User Secrets (must set manually on each machine)

```bash
cd TNBSetlistMaker.Web
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your-postgres-connection-string>"
dotnet user-secrets set "Spotify:ClientId" "<your-client-id>"
dotnet user-secrets set "Spotify:ClientSecret" "<your-client-secret>"
dotnet user-secrets set "SendGrid:ApiKey" "<your-sendgrid-api-key>"
```

SecretId: `1940e3f6-fa3e-454c-b26e-fd9a730ce7ab`

## TODOs

- [ ] **SendGrid sender domain** — verify `thenashvilleband.com` in SendGrid (Settings → Sender Authentication → Domain Authentication), then change `FromEmail` back to `noreply@thenashvilleband.com` in `TNBSetlistMaker.Bll/Services/SendGridEmailService.cs`
- [ ] **Bandleader email** — replace `nickvee2012@gmail.com` with the real bandleader email in `SendGridEmailService.cs` (`BandleaderEmail` constant)
- [ ] **`App:FrontendUrl` config** — must be set in `appsettings.json` (or environment) to the deployed frontend URL. Used by `SetlistService` to generate the `/?editApproved=TNB-XXXX` link sent to the client in the edit-approval email.
