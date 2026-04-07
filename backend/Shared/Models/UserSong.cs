using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class UserSong
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public Guid SongId { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPlayedAt { get; set; }

    // Individual Performance (User-Only)
    public int PlayCount { get; set; } = 0;
    public long TotalPlaySeconds { get; set; } = 0;
    public int MatchesWon { get; set; } = 0;
    public int TournamentsWon { get; set; } = 0;
    
    [Column(TypeName = "decimal(5, 2)")]
    public decimal WinRate { get; set; } = 0;

    // Personal Customization
    public string? PersonalNotes { get; set; }
    public int UserRating { get; set; } = 0; // 1-10
    public int MasteryLevel { get; set; } = 0; // 1-100

    // Navigation and Join Properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("SongId")]
    public virtual Song? Song { get; set; }
}
