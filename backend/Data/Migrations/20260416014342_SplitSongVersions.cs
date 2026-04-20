using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Setlist.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SplitSongVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Songs_YouTubeId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "YouTubeId",
                table: "Songs");

            migrationBuilder.AddColumn<string>(
                name: "AppleTrackId",
                table: "Songs",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SongVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    YouTubeId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ChannelName = table.Column<string>(type: "text", nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "text", nullable: true),
                    Duration = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SongVersions_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Songs_AppleTrackId",
                table: "Songs",
                column: "AppleTrackId");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_SongId",
                table: "SongVersions",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_YouTubeId",
                table: "SongVersions",
                column: "YouTubeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_Songs_AppleTrackId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "AppleTrackId",
                table: "Songs");

            migrationBuilder.AddColumn<string>(
                name: "YouTubeId",
                table: "Songs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_YouTubeId",
                table: "Songs",
                column: "YouTubeId",
                unique: true);
        }
    }
}
