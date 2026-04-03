import { Music } from "lucide-react"

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6" />
          <span className="text-lg font-semibold">TNB Setlist Maker</span>
        </div>
      </div>
    </nav>
  )
}
