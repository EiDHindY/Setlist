using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class SetlistSong
{
    [Required]
    public Guid SetlistId { get; set; }

    [Required]
    public Guid SongId { get; set; }

    public int Position { get; set; } = 0; // For manual sorting in the setlist

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation and Join Properties
    [ForeignKey("SetlistId")]
    public virtual MusicSetlist? Setlist { get; set; }

    [ForeignKey("SongId")]
    public virtual Song? Song { get; set; }
}
