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
```

SecretId: `1940e3f6-fa3e-454c-b26e-fd9a730ce7ab`
