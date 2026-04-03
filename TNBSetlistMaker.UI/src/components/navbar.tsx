export function Navbar() {
  return (
    <nav className="bg-background">
      <div className="flex h-28 items-center justify-center gap-4 px-6">
        <img src="/TNB.webp" alt="TNB logo" className="h-24 w-auto" />
        <span
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-2xl font-semibold tracking-wide text-primary"
        >
          Set The Night
        </span>
      </div>
    </nav>
  );
}
