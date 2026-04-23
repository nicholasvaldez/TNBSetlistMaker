import { useState } from "react";

interface RestoreSessionInputProps {
  onRestore: (code: string) => Promise<boolean>;
}

export function RestoreSessionInput({ onRestore }: RestoreSessionInputProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    const success = await onRestore(trimmed);
    setLoading(false);

    if (!success) {
      setError("Code not found. Check your confirmation email and try again.");
    } else {
      setOpen(false);
      setCode("");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-bone/35 hover:text-bone/60 underline underline-offset-2"
      >
        Already submitted? Restore your session
      </button>
    );
  }

  return (
    <form onSubmit={handleRestore} className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="TNB-XXXX"
        maxLength={8}
        className="rounded-md border hairline bg-ink/40 text-bone px-3 py-1.5 text-xs w-28 placeholder:text-bone/30 font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-gold"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-md border hairline text-bone/60 hover:text-bone"
      >
        {loading ? "…" : "Restore"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="text-xs text-bone/35 hover:text-bone/60"
      >
        Cancel
      </button>
      {error && <p className="w-full text-[11px] text-skip">{error}</p>}
    </form>
  );
}
