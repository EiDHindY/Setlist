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

    public string? DisplayName { get; set; }

    public string? Location { get; set; }

    public string? Bio { get; set; }

    public bool IsPremium { get; set; } = false;

    // Optional: we can store genres as a comma-separated string, or leave it for a separate table later.
    public string? PreferredGenres { get; set; }

    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    public int ExperiencePoints { get; set; } = 0;

    public int Level { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
