using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TNBSetlistMaker.Dal.Migrations
{
    /// <inheritdoc />
    public partial class RenameSpotifyUrlToSpotifyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SpotifyUrl",
                table: "TrackedPlaylists",
                newName: "SpotifyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SpotifyId",
                table: "TrackedPlaylists",
                newName: "SpotifyUrl");
        }
    }
}
