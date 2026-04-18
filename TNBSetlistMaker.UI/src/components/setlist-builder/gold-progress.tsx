interface GoldProgressProps {
  value: number;
  className?: string;
}

export function GoldProgress({ value, className = "" }: GoldProgressProps) {
  return (
    <div className={`h-[3px] w-full bg-bone/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg, #a8863a, #e3c77a)",
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}
