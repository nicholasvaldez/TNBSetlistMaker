import { useState, useRef, useEffect } from "react";

interface RestoreSessionInputProps {
  onRestore: (code: string) => Promise<boolean>;
}

export function RestoreSessionInput({ onRestore }: RestoreSessionInputProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    const success = await onRestore(trimmed);
    setLoading(false);
    if (!success) {
      setError("Code not found. Check your confirmation email.");
    } else {
      setOpen(false);
      setCode("");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ? button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Restore a previous session"
        className="w-7 h-7 rounded-full border hairline flex items-center justify-center text-bone/35 hover:text-bone/70 hover:border-bone/30 text-xs font-mono transition-colors"
      >
        ?
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-9 left-0 w-64 paper rounded-xl ring-gold p-4 fade-up shadow-xl">
          <p className="stamp mb-2">Restore session</p>
          <p className="text-[11px] text-bone/55 mb-3 leading-snug">
            Already submitted? Enter your code from the confirmation email.
          </p>
          <form onSubmit={handleRestore} className="flex flex-col gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TNB-XXXX"
              maxLength={8}
              autoFocus
              className="rounded-md border hairline bg-ink/40 text-bone px-3 py-1.5 text-xs w-full placeholder:text-bone/30 font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {error && <p className="text-[11px] text-skip leading-snug">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="chip-gold rounded-md px-3 py-1.5 text-xs font-medium w-full"
            >
              {loading ? "Restoring…" : "Restore session"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
