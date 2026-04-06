using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Setlist.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActiveAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredGenres",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bio",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastActiveAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreferredGenres",
                table: "Users");
        }
    }
}
