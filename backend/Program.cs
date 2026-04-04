using Setlist.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Register SignalR (real-time WebSockets engine)
builder.Services.AddSignalR();

// Register CORS (Cross-Origin Resource Sharing)
// This allows your Next.js and Expo apps to connect safely from their local servers
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClientApps", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000", // Next.js web app default port
            "http://localhost:8081"  // Expo mobile app default port
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

app.UseHttpsRedirection();

// 1. Enforce the CORS policy so it is actively blocking weird requests
app.UseCors("AllowClientApps");

// 2. Map the "Front Door" routing
// If a browser connects to "localhost:xxxx/hub/clash", hand the request to the ClashHub class
app.MapHub<ClashHub>("/hub/clash");

app.Run();
