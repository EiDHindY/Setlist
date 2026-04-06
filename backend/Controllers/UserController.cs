using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Setlist.Api.Data;
using Setlist.Shared.Models;

namespace Setlist.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncProfile([FromBody] UserSyncRequest request)
    {
        if (string.IsNullOrEmpty(request.Id)) return BadRequest("User ID is required");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.Id);

        if (user == null)
        {
            // First time login -> Create new Level 1 user
            user = new User
            {
                Id = request.Id,
                Email = request.Email,
                FullName = request.FullName,
                AvatarUrl = request.AvatarUrl,
                ExperiencePoints = 0,
                Level = 1,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
        }
        else
        {
            // Sync current Google photo/name
            user.FullName = request.FullName;
            user.AvatarUrl = request.AvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(user);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(string id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        return Ok(user);
    }
}

public class UserSyncRequest
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
}
