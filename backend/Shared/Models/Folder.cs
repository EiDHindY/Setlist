using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class Folder
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string OwnerId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("OwnerId")]
    public virtual User? Owner { get; set; }

    public virtual ICollection<MusicSetlist> Setlists { get; set; } = new List<MusicSetlist>();
}
