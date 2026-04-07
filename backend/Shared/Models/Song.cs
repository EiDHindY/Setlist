using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class Song
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Artist { get; set; } = string.Empty;

    public string? Album { get; set; }

    [Required]
    public string YouTubeId { get; set; } = string.Empty; // For direct streaming

    public string? ISRC { get; set; } // International Standard Recording Code

    // Technical Metadata
    public int? BPM { get; set; }
    public string? MusicalKey { get; set; }
    public string? MoodTags { get; set; } 
    public int Duration { get; set; } // In seconds
    public string? WaveformData { get; set; } // Pre-calculated waveform JSON/Map

    // Performance Stats
    public int PlayCount { get; set; } = 0;
    public long TotalPlaySeconds { get; set; } = 0;
    public int CollectionCount { get; set; } = 0;
    public int MatchesWon { get; set; } = 0;
    public int TournamentsWon { get; set; } = 0;
    
    [Column(TypeName = "decimal(5, 2)")]
    public decimal WinRate { get; set; } = 0;

    // Heritage & Content
    public DateTime? ReleaseDate { get; set; }
    public string? BandNotes { get; set; }
    public string? AlbumArtUrl { get; set; }
    public string? Url { get; set; }

    [Required]
    public string CreatedBy { get; set; } = string.Empty; // User ID who added/uploaded

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property for Modular Credits
    public virtual ICollection<Credit> Credits { get; set; } = new List<Credit>();
}
