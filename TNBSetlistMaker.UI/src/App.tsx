import { Navbar } from "@/components/navbar";
import { DataTable } from "@/components/songs-table/data-table";
import { columns } from "@/components/songs-table/columns";
import { useSongs } from "@/hooks/use-songs";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

function App() {
  const { songs, loading, error } = useSongs();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col min-h-0 container mx-auto py-6 px-6">
        {/* <h1 className="text-2xl font-bold mb-1">Songs</h1>
        <p className="text-sm text-muted-foreground mb-4">Rate songs for your setlist</p> */}
        {loading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && (
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden p-5 rounded-xl">
            <DataTable columns={columns} data={songs} />
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
