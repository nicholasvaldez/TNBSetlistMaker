import { MOMENTS, type Moment } from "@/types/moment";

interface MomentChipProps {
  moment: string | Moment;
  active?: boolean;
  onClick?: () => void;
  size?: "xs" | "sm";
}

export function MomentChip({ moment, active = true, onClick, size = "sm" }: MomentChipProps) {
  const m = typeof moment === "string" ? MOMENTS.find((x) => x.id === moment) : moment;
  if (!m) return null;

  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]";

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full ${pad} font-medium tracking-wide ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        background: active ? "rgba(227,199,122,0.15)" : "transparent",
        color: active ? "#e3c77a" : "rgba(241,234,216,0.5)",
        boxShadow: active
          ? "inset 0 0 0 1px rgba(227,199,122,0.5)"
          : "inset 0 0 0 1px rgba(241,234,216,0.18)",
      }}
    >
      <span aria-hidden>{m.glyph}</span>
      {m.label}
    </span>
  );
}
