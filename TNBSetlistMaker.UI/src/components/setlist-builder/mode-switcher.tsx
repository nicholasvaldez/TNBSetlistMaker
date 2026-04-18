export type ViewMode = "stack" | "grid" | "list";

interface ModeSwitcherProps {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const MODES = [
  { id: "stack" as ViewMode, label: "Stack", icon: "▣" },
  { id: "grid" as ViewMode, label: "Grid", icon: "⚏" },
  { id: "list" as ViewMode, label: "List", icon: "☰" },
];

export function ModeSwitcher({ mode, setMode }: ModeSwitcherProps) {
  return (
    <div className="inline-flex rounded-md border hairline overflow-hidden bg-ink/40">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 ${
            mode === m.id ? "bg-gold/20 text-goldlight" : "text-bone/60 hover:text-bone"
          }`}
        >
          <span className="font-mono">{m.icon}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
