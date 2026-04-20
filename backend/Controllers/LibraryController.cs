using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Setlist.Api.Data;
using Setlist.Shared.Models;

namespace Setlist.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LibraryController : ControllerBase
{
    private readonly AppDbContext _context;

    public LibraryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("debug-usersongs")]
    public async Task<IActionResult> DebugUserSongs()
    {
        var data = await _context.UserSongs.ToListAsync();
        return Ok(data);
    }
    
    [HttpGet("debug-users")]
    public async Task<IActionResult> DebugUsers()
    {
        var data = await _context.Users.ToListAsync();
        return Ok(data);
    }

    /// <summary>
    /// Fetches all songs in a user's library.
    /// </summary>
    [HttpGet("songs/{userId}")]
    public async Task<IActionResult> GetUserSongs(string userId)
    {
        var userSongs = await _context.UserSongs
            .Include(us => us.Song)
                .ThenInclude(s => s.Versions.Where(v => v.UserId == userId))
            .Where(us => us.UserId == userId)
            .OrderByDescending(us => us.AddedAt)
            .Select(us => us.Song)
            .ToListAsync();

        return Ok(userSongs);
    }

    /// <summary>
    /// Saves a song to the user's library. Creates the song in the global 
    /// catalog if it doesn't already exist.
    /// </summary>
    [HttpPost("save")]
    public async Task<IActionResult> SaveSong([FromBody] SaveSongRequest request)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return BadRequest("UserId is required.");
        }

        // 0. Ensure user exists locally (in case of sync drop during dev)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user == null)
        {
            user = new User
            {
                Id = request.UserId,
                Email = "unknown@setlist.app",
                FullName = "Unknown User",
                DisplayName = "Unknown User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // 1. Find or Create Global Master Song
        Song? song = null;
        if (!string.IsNullOrEmpty(request.AppleTrackId))
        {
            song = await _context.Songs.FirstOrDefaultAsync(s => s.AppleTrackId == request.AppleTrackId);
        }
        
        if (song == null)
        {
            song = await _context.Songs.FirstOrDefaultAsync(s => s.Title == request.Title && s.Artist == request.Artist);
        }

        if (song == null)
        {
            song = new Song
            {
                AppleTrackId = request.AppleTrackId,
                Title = request.Title,
                Artist = request.Artist,
                AlbumArtUrl = request.AlbumArtUrl,
                Duration = request.Duration, // Master duration
                CreatedBy = request.UserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Songs.Add(song);
            await _context.SaveChangesAsync();
        }

        // 2. Attach Master Song to User Library
        var userSong = await _context.UserSongs.FirstOrDefaultAsync(us => us.UserId == request.UserId && us.SongId == song.Id);
        if (userSong == null)
        {
            userSong = new UserSong
            {
                UserId = request.UserId,
                SongId = song.Id,
                AddedAt = DateTime.UtcNow
            };
            _context.UserSongs.Add(userSong);
            await _context.SaveChangesAsync();
        }

        // Return updated song with eager loaded versions
        var fullSong = await _context.Songs
            .Include(s => s.Versions)
            .FirstOrDefaultAsync(s => s.Id == song.Id);

        return Ok(fullSong ?? song);
    }

    /// <summary>
    /// Attaches a new YouTube Video Version to a specific Master Song constraint.
    /// </summary>
    [HttpPost("save/version")]
    public async Task<IActionResult> SaveSongVersion([FromBody] SaveSongVersionRequest request)
    {
        if (string.IsNullOrEmpty(request.SongId) || string.IsNullOrEmpty(request.YouTubeId) || string.IsNullOrEmpty(request.UserId))
            return BadRequest("Missing required fields for version.");

        if (!Guid.TryParse(request.SongId, out Guid parentSongId))
            return BadRequest("Invalid Song ID format.");

        var song = await _context.Songs
            .Include(s => s.Versions.Where(v => v.UserId == request.UserId))
            .FirstOrDefaultAsync(s => s.Id == parentSongId);
        if (song == null) return NotFound("Parent song not found.");

        var version = song.Versions.FirstOrDefault(v => v.YouTubeId == request.YouTubeId);
        if (version == null)
        {
            version = new SongVersion
            {
                SongId = song.Id,
                UserId = request.UserId,
                YouTubeId = request.YouTubeId,
                Title = request.VersionTitle,
                ChannelName = request.ChannelName,
                ThumbnailUrl = request.ThumbnailUrl,
                Duration = request.Duration,
                AddedAt = DateTime.UtcNow
            };
            _context.SongVersions.Add(version);
            await _context.SaveChangesAsync();
        }

        return Ok(version);
    }

    /// <summary>
    /// Removes a song from a user's library.
    /// </summary>
    [HttpDelete("songs/{userId}/{songId}")]
    public async Task<IActionResult> RemoveSong(string userId, Guid songId)
    {
        var userSong = await _context.UserSongs.FirstOrDefaultAsync(us => us.UserId == userId && us.SongId == songId);
        if (userSong == null) return NotFound("Song not in user library.");

        _context.UserSongs.Remove(userSong);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    /// <summary>
    /// Simple health check/sync for setlists (Placeholder for now)
    /// </summary>
    [HttpGet("setlists/{userId}")]
    public async Task<IActionResult> GetUserSetlists(string userId)
    {
        var setlists = await _context.Setlists
            .Where(s => s.OwnerId == userId)
            .ToListAsync();
            
        return Ok(setlists);
    }
}

public class SaveSongRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? AppleTrackId { get; set; }
    public string Title { get; set; } = string.Empty; // Master Title
    public string Artist { get; set; } = string.Empty; // Master Artist
    public string? AlbumArtUrl { get; set; }
    public int Duration { get; set; } // General metadata average duration, optional
}

public class SaveSongVersionRequest
{
    public string UserId { get; set; } = string.Empty;
    public string SongId { get; set; } = string.Empty; // The Parent ID
    public string YouTubeId { get; set; } = string.Empty;
    public string VersionTitle { get; set; } = string.Empty; 
    public string? ChannelName { get; set; }
    public string? ThumbnailUrl { get; set; } 
    public int Duration { get; set; }
}
