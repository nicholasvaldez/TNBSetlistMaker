using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TNBSetlistMaker.Dal.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackedPlaylists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrackedPlaylists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SpotifyUrl = table.Column<string>(type: "text", nullable: false),
                    LastSynced = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackedPlaylists", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrackedPlaylists");
        }
    }
}
