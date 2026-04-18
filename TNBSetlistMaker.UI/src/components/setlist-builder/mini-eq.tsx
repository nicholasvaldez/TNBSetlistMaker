interface MiniEqProps {
  active?: boolean;
}

export function MiniEq({ active = false }: MiniEqProps) {
  return (
    <div className="inline-flex items-end gap-[2px] h-3 ml-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-[2px] h-full bg-goldlight ${active ? "eq-bar" : ""}`}
          style={{
            animationDelay: active ? `${i * 140}ms` : undefined,
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}
