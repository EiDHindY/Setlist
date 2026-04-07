using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Setlist.Shared.Models;

public class Credit
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SongId { get; set; }

    [Required]
    public string Role { get; set; } = string.Empty; // e.g., "Producer", "Mixer", "Guitarist"

    [Required]
    public string Name { get; set; } = string.Empty;

    // Navigation property 
    [ForeignKey("SongId")]
    public virtual Song? Song { get; set; }
}
