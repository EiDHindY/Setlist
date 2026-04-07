using Microsoft.EntityFrameworkCore;
using Setlist.Shared.Models;

namespace Setlist.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Song> Songs { get; set; }
    public DbSet<Credit> Credits { get; set; }
    public DbSet<Folder> Folders { get; set; }
    public DbSet<MusicSetlist> Setlists { get; set; }
    public DbSet<SetlistSong> SetlistSongs { get; set; }
    public DbSet<UserSong> UserSongs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // User constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Song constraints
        modelBuilder.Entity<Song>()
            .HasIndex(s => s.YouTubeId)
            .IsUnique();

        modelBuilder.Entity<Song>()
            .HasIndex(s => s.ISRC)
            .IsUnique();

        // One-to-Many: Song has many Credits
        modelBuilder.Entity<Credit>()
            .HasOne(c => c.Song)
            .WithMany(s => s.Credits)
            .HasForeignKey(c => c.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-Many: User has many Folders
        modelBuilder.Entity<Folder>()
            .HasOne(f => f.Owner)
            .WithMany(u => u.Folders)
            .HasForeignKey(f => f.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-Many: User has many Setlists
        modelBuilder.Entity<MusicSetlist>()
            .HasOne(s => s.Owner)
            .WithMany(u => u.Setlists)
            .HasForeignKey(s => s.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-Many: Folder has many Setlists (Optional)
        modelBuilder.Entity<MusicSetlist>()
            .HasOne(s => s.Folder)
            .WithMany(f => f.Setlists)
            .HasForeignKey(s => s.FolderId)
            .OnDelete(DeleteBehavior.SetNull);

        // Many-to-Many: Setlist <-> Song (SetlistSong)
        modelBuilder.Entity<SetlistSong>()
            .HasKey(ss => new { ss.SetlistId, ss.SongId });

        modelBuilder.Entity<SetlistSong>()
            .HasOne(ss => ss.Setlist)
            .WithMany(s => s.SetlistSongs)
            .HasForeignKey(ss => ss.SetlistId);

        modelBuilder.Entity<SetlistSong>()
            .HasOne(ss => ss.Song)
            .WithMany() // Songs don't strictly need a back-reference to every setlist mapping
            .HasForeignKey(ss => ss.SongId);

        // Many-to-Many: User <-> Song (UserSong)
        modelBuilder.Entity<UserSong>()
            .HasKey(us => new { us.UserId, us.SongId });

        modelBuilder.Entity<UserSong>()
            .HasOne(us => us.User)
            .WithMany(u => u.UserSongs)
            .HasForeignKey(us => us.UserId);

        modelBuilder.Entity<UserSong>()
            .HasOne(us => us.Song)
            .WithMany()
            .HasForeignKey(us => us.SongId);
    }
}
