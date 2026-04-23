using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TNBSetlistMaker.Dal.Migrations
{
    /// <inheritdoc />
    public partial class AddSetlistSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Setlists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    EventName = table.Column<string>(type: "text", nullable: false),
                    EventDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ClientEmail = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    EditApprovalToken = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Setlists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SetlistEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SetlistId = table.Column<Guid>(type: "uuid", nullable: false),
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SetlistEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SetlistEntries_Setlists_SetlistId",
                        column: x => x.SetlistId,
                        principalTable: "Setlists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SetlistEntries_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SetlistEntryMoments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SetlistEntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    MomentId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SetlistEntryMoments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SetlistEntryMoments_SetlistEntries_SetlistEntryId",
                        column: x => x.SetlistEntryId,
                        principalTable: "SetlistEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SetlistEntries_SetlistId",
                table: "SetlistEntries",
                column: "SetlistId");

            migrationBuilder.CreateIndex(
                name: "IX_SetlistEntries_SongId",
                table: "SetlistEntries",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SetlistEntryMoments_SetlistEntryId",
                table: "SetlistEntryMoments",
                column: "SetlistEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_Setlists_Code",
                table: "Setlists",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SetlistEntryMoments");

            migrationBuilder.DropTable(
                name: "SetlistEntries");

            migrationBuilder.DropTable(
                name: "Setlists");
        }
    }
}
