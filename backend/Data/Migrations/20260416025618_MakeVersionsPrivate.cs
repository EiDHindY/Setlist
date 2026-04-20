using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Setlist.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeVersionsPrivate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SongVersions_YouTubeId",
                table: "SongVersions");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "SongVersions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_UserId",
                table: "SongVersions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_YouTubeId",
                table: "SongVersions",
                column: "YouTubeId");

            migrationBuilder.AddForeignKey(
                name: "FK_SongVersions_Users_UserId",
                table: "SongVersions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SongVersions_Users_UserId",
                table: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_SongVersions_UserId",
                table: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_SongVersions_YouTubeId",
                table: "SongVersions");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "SongVersions");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_YouTubeId",
                table: "SongVersions",
                column: "YouTubeId",
                unique: true);
        }
    }
}
