using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Setlist.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSongsAndCredits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Songs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Artist = table.Column<string>(type: "text", nullable: false),
                    Album = table.Column<string>(type: "text", nullable: true),
                    YouTubeId = table.Column<string>(type: "text", nullable: false),
                    ISRC = table.Column<string>(type: "text", nullable: true),
                    BPM = table.Column<int>(type: "integer", nullable: true),
                    MusicalKey = table.Column<string>(type: "text", nullable: true),
                    MoodTags = table.Column<string>(type: "text", nullable: true),
                    Duration = table.Column<int>(type: "integer", nullable: false),
                    WaveformData = table.Column<string>(type: "text", nullable: true),
                    PlayCount = table.Column<int>(type: "integer", nullable: false),
                    TotalPlaySeconds = table.Column<long>(type: "bigint", nullable: false),
                    CollectionCount = table.Column<int>(type: "integer", nullable: false),
                    MatchesWon = table.Column<int>(type: "integer", nullable: false),
                    TournamentsWon = table.Column<int>(type: "integer", nullable: false),
                    WinRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BandNotes = table.Column<string>(type: "text", nullable: true),
                    AlbumArtUrl = table.Column<string>(type: "text", nullable: true),
                    Url = table.Column<string>(type: "text", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Songs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Credits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Credits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Credits_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Credits_SongId",
                table: "Credits",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_ISRC",
                table: "Songs",
                column: "ISRC",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Songs_YouTubeId",
                table: "Songs",
                column: "YouTubeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Credits");

            migrationBuilder.DropTable(
                name: "Songs");
        }
    }
}
