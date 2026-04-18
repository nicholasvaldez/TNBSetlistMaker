using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TNBSetlistMaker.Dal.Migrations
{
    /// <inheritdoc />
    public partial class AddPreviewUrlToSong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreviewUrl",
                table: "Songs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreviewUrl",
                table: "Songs");
        }
    }
}
