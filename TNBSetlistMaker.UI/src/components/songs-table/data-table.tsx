import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PlaylistFilter } from "@/components/songs-table/playlist-filter";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FaHeart, FaMeh, FaTimesCircle, FaList, FaRegCircle } from "react-icons/fa";

interface DataTableProps {
  columns: ColumnDef<Song>[];
  data: Song[];
}

export function DataTable({ columns, data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [ratings, setRatings] = useState<Map<string, SongRating>>(new Map());
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  function setRating(songId: string, rating: SongRating) {
    setRatings((prev) => {
      const next = new Map(prev);
      if (rating === null) next.delete(songId);
      else next.set(songId, rating);
      return next;
    });
  }

  const uniquePlaylists = useMemo(() => [...new Set(data.map((s) => s.playlistName))].sort(), [data]);

  const filteredData = useMemo(() => {
    if (ratingFilter === "all") return data;
    if (ratingFilter === "unrated") return data.filter((s) => !ratings.has(s.id));
    return data.filter((s) => ratings.get(s.id) === ratingFilter);
  }, [data, ratingFilter, ratings]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    meta: {
      playlists: uniquePlaylists,
      ratings,
      setRating,
    },
  });

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border flex-wrap">
        <div className="flex items-center gap-3">
          <Select
            value={ratingFilter}
            onValueChange={(val) => {
              setRatingFilter(val);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-auto min-w-44 h-10">
              <SelectValue placeholder="Filter rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <FaList className="text-muted-foreground" /> All rated songs
                </span>
              </SelectItem>
              <SelectItem value="unrated">
                <span className="flex items-center gap-2">
                  <FaRegCircle className="text-muted-foreground" /> Unrated
                </span>
              </SelectItem>
              <SelectItem value="must" className="focus:bg-[#5d7a5c]/20 focus:text-[#5d7a5c]">
                <span className="flex items-center gap-2">
                  <FaHeart /> Must
                </span>
              </SelectItem>
              <SelectItem value="fine" className="focus:bg-[#c47d32]/20 focus:text-[#c47d32]">
                <span className="flex items-center gap-2">
                  <FaMeh /> Maybe
                </span>
              </SelectItem>
              <SelectItem value="skip" className="focus:bg-[#a64d3d]/20 focus:text-[#a64d3d]">
                <span className="flex items-center gap-2">
                  <FaTimesCircle /> Skip
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <PlaylistFilter column={table.getColumn("playlistName")!} options={uniquePlaylists} />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-primary border-primary hover:bg-primary/10 hover:text-primary"
          disabled={ratings.size === 0}
          onClick={() => {
            const rows = data
              .filter((s) => ratings.has(s.id))
              .map((s) => {
                const r = ratings.get(s.id)!;
                const label = r === "must" ? "Must" : r === "fine" ? "Maybe" : "Skip";
                return `"${s.title.replace(/"/g, '""')}","${s.artist.replace(/"/g, '""')}","${s.playlistName.replace(/"/g, '""')}","${label}"`;
              });
            const csv = ["Title,Artist,Playlist,Rating", ...rows].join("\n");
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            a.download = "rated-songs.csv";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto relative">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "36%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody key={(table.getColumn("playlistName")?.getFilterValue() as string[] | undefined)?.join(",") ?? ""}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => {
                const rating = ratings.get((row.original as Song).id);
                const rowBg =
                  rating === "must"
                    ? "bg-[#5d7a5c]/15 hover:bg-[#5d7a5c]/25"
                    : rating === "fine"
                      ? "bg-[#c47d32]/15 hover:bg-[#c47d32]/25"
                      : rating === "skip"
                        ? "bg-[#a64d3d]/15 hover:bg-[#a64d3d]/25"
                        : "hover:bg-muted/20";
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`animate-[row-in_200ms_ease-out_both] transition-colors ${rowBg}`}
                    style={{ animationDelay: `${Math.min(i * 20, 160)}ms` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          {(() => {
            const visibleRows = table.getFilteredRowModel().rows;
            const visibleIds = new Set(visibleRows.map((r) => r.original.id));
            const visibleTotal = visibleRows.length;
            const visibleRated = [...ratings.keys()].filter((id) => visibleIds.has(id)).length;
            return (
              <>
                <Progress value={visibleTotal ? (visibleRated / visibleTotal) * 100 : 0} className="w-24 h-2" />
                <span className="whitespace-nowrap">
                  {visibleRated} / {visibleTotal} rated
                </span>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            Rows per page:
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(val) => setPagination((_p) => ({ pageIndex: 0, pageSize: Number(val) }))}
            >
              <SelectTrigger className="h-8 w-17.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text=""
                  onClick={(e) => {
                    e.preventDefault();
                    table.previousPage();
                  }}
                  aria-disabled={!table.getCanPreviousPage()}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text=""
                  onClick={(e) => {
                    e.preventDefault();
                    table.nextPage();
                  }}
                  aria-disabled={!table.getCanNextPage()}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
