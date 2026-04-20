using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class SongVersion
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public Guid SongId { get; set; }

    [Required]
    public string YouTubeId { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty; // e.g. YouTube Video Title

    public string? ChannelName { get; set; }
    public string? ThumbnailUrl { get; set; }
    
    public int Duration { get; set; } = 0; // Duration of this specific video

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Optional: we can add PlayCount here later if we want version-specific stats

    [ForeignKey("SongId")]
    [JsonIgnore]
    public virtual Song? Song { get; set; }

    [ForeignKey("UserId")]
    [JsonIgnore]
    public virtual User? User { get; set; }
}
