import { Navbar } from "@/components/navbar"
import { DataTable } from "@/components/songs-table/data-table"
import { columns } from "@/components/songs-table/columns"
import { useSongs } from "@/hooks/use-songs"

function App() {
  const { songs, loading, error } = useSongs()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Songs</h1>
        {loading && <p className="text-muted-foreground">Loading songs...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}
        {!loading && !error && <DataTable columns={columns} data={songs} />}
      </main>
    </div>
  )
}

export default App
