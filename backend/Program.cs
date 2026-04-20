using Microsoft.EntityFrameworkCore;
using Setlist.Api.Data;
using Setlist.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register the Database Context (Supabase/PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

// Register SignalR (real-time WebSockets engine)
// We add the Redis Backplane if a connection string is present
var redisConnection = builder.Configuration.GetConnectionString("RedisConnection");
var signalrBuilder = builder.Services.AddSignalR();

if (!string.IsNullOrEmpty(redisConnection))
{
    signalrBuilder.AddStackExchangeRedis(redisConnection);
}

// Register CORS (Cross-Origin Resource Sharing)
// This allows your Next.js and Expo apps to connect safely from their local servers
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClientApps", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",      // Next.js local
            "http://localhost:8081",      // Expo local
            "https://setlist-9ab.pages.dev" // LIVE CLOUDFLARE SITE
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials(); // CRITICAL: This is required for WebSockets/SignalR to work
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

// 1. Enforce the CORS policy so it is actively blocking weird requests
app.UseCors("AllowClientApps");

// 2. Map the "Front Door" routing
// If a browser connects to "localhost:xxxx/hub/clash", hand the request to the ClashHub class
app.MapControllers();
app.MapHub<ClashHub>("/hub/clash");

app.Run();
