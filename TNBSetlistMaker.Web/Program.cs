using Microsoft.EntityFrameworkCore;
using TNBSetlistMaker.Dal.Data;
using TNBSetlistMaker.Dal.Repositories;
using TNBSetlistMaker.Domain.Interfaces;
using TNBSetlistMaker.Bll.Interfaces;
using TNBSetlistMaker.Bll.Services;
using Hangfire;
using Hangfire.PostgreSql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = builder.Configuration["App:FrontendUrl"] ?? "http://localhost:5173";
        var origins = new List<string> { frontendUrl };
        if (builder.Environment.IsDevelopment())
        {
            origins.Add("http://localhost:5173");
            origins.Add("http://127.0.0.1:5173");
        }
        policy.WithOrigins(origins.Distinct().ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("TNBSetlistMaker.Dal")));
builder.Services.AddHttpClient<ISpotifyService, SpotifyService>();
builder.Services.AddScoped<IEmailService, SendGridEmailService>();
builder.Services.AddScoped<ISetlistRepository, SetlistRepository>();
builder.Services.AddScoped<ISpotifyRepository, SpotifyRepository>();
builder.Services.AddScoped<ISetlistService>(sp =>
    new SetlistService(
        sp.GetRequiredService<ISetlistRepository>(),
        sp.GetRequiredService<IEmailService>(),
        builder.Configuration["App:BaseUrl"] ?? "http://localhost:5152",
        builder.Configuration["App:FrontendUrl"] ?? "http://localhost:5173"));
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => 
        options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));
builder.Services.AddHangfireServer();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.UseStaticFiles();

app.MapControllers();

app.MapGet("/admin", () => Results.File(
    Path.Combine(app.Environment.ContentRootPath, "wwwroot", "admin.html"),
    "text/html"));

RecurringJob.AddOrUpdate<ISpotifyService>(
    "sync-all-playlists",
    s => s.SyncAllTrackedPlaylistsAsync(),
    Cron.Daily);

app.Run();
