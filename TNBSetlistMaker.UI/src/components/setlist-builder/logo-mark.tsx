interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className = "" }: LogoMarkProps) {
  return (
    <img
      src="/TNB.webp"
      alt="The Nashville Band"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
