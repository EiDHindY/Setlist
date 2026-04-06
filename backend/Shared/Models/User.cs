using System.ComponentModel.DataAnnotations;

namespace Setlist.Shared.Models;

public class User
{
    [Key]
    public string Id { get; set; } = string.Empty; // Supabase Auth User ID

    [Required]
    public string Email { get; set; } = string.Empty;

    public string? FullName { get; set; }

    public string? AvatarUrl { get; set; } // Gmail photo

    public int ExperiencePoints { get; set; } = 0;

    public int Level { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
