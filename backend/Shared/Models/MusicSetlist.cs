using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class MusicSetlist
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? FolderId { get; set; } // Optional: A setlist can be in a Folder

    [Required]
    public string OwnerId { get; set; } = string.Empty;

    public bool IsPublic { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("OwnerId")]
    public virtual User? Owner { get; set; }

    [ForeignKey("FolderId")]
    public virtual Folder? Folder { get; set; }

    public virtual ICollection<SetlistSong> SetlistSongs { get; set; } = new List<SetlistSong>();
}
