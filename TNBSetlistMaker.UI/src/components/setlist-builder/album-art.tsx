import type { Song } from "@/types/song";

const ART_PALETTES = [
  ["#6a1e15", "#c7a24c"],
  ["#1f3a2f", "#e3c77a"],
  ["#2a2016", "#d69a44"],
  ["#3b1d2a", "#b85c4a"],
  ["#16263b", "#7e9a6a"],
  ["#2a1a2e", "#c7a24c"],
  ["#1a2a2a", "#e3c77a"],
  ["#3a241a", "#d69a44"],
];

function paletteFor(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ART_PALETTES[h % ART_PALETTES.length] as [string, string];
}

function artSvg(song: Song): string {
  const [bg, fg] = paletteFor(song.id);
  let h = 0;
  for (let i = 0; i < song.id.length; i++) h = (h * 17 + song.id.charCodeAt(i)) >>> 0;
  const variant = h % 6;
  const initials = song.artist
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
  const letters = (song.title[0] || "").toUpperCase();

  const blocks: Record<number, string> = {
    0: `<circle cx="140" cy="140" r="70" fill="${fg}" opacity="0.88"/>
        <circle cx="140" cy="140" r="42" fill="${bg}"/>
        <circle cx="140" cy="140" r="8"  fill="${fg}"/>`,
    1: `<path d="M0 200 Q70 140 140 200 T 280 200 V280 H0Z" fill="${fg}" opacity="0.85"/>
        <circle cx="210" cy="70" r="38" fill="${fg}" opacity="0.9"/>`,
    2: `<rect x="30" y="30" width="220" height="220" fill="none" stroke="${fg}" stroke-width="2"/>
        <rect x="60" y="60" width="160" height="160" fill="none" stroke="${fg}" stroke-width="2"/>
        <rect x="90" y="90" width="100" height="100" fill="${fg}" opacity="0.8"/>`,
    3: `<g stroke="${fg}" stroke-width="6">
          <line x1="0" y1="40" x2="280" y2="40"/>
          <line x1="0" y1="80" x2="280" y2="80"/>
          <line x1="0" y1="120" x2="280" y2="120"/>
        </g>
        <circle cx="210" cy="200" r="48" fill="${fg}" opacity="0.9"/>`,
    4: `<polygon points="140,30 250,250 30,250" fill="${fg}" opacity="0.9"/>
        <circle cx="140" cy="170" r="26" fill="${bg}"/>`,
    5: `<g fill="${fg}" opacity="0.85">
          <rect x="20"  y="180" width="24" height="80"/>
          <rect x="60"  y="140" width="24" height="120"/>
          <rect x="100" y="100" width="24" height="160"/>
          <rect x="140" y="60"  width="24" height="200"/>
          <rect x="180" y="100" width="24" height="160"/>
          <rect x="220" y="160" width="24" height="100"/>
        </g>`,
  };

  const year = song.year || "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280">
    <rect width="280" height="280" fill="${bg}"/>
    ${blocks[variant]}
    <g font-family="Cormorant Garamond, serif" fill="${fg}">
      <text x="20" y="40" font-size="14" letter-spacing="4" font-weight="500" opacity="0.8">${initials}</text>
      <text x="20" y="264" font-size="18" font-style="italic" opacity="0.8">${year}</text>
    </g>
    <text x="260" y="40" font-family="Cormorant Garamond, serif" font-size="54" font-weight="600" fill="${fg}" text-anchor="end" opacity="0.9">${letters}</text>
  </svg>`;
}

export function artDataUrl(song: Song): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(artSvg(song))}`;
}

export { paletteFor };

interface AlbumArtProps {
  song: Song;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  spinning?: boolean;
}

export function AlbumArt({ song, size = "md", spinning = false }: AlbumArtProps) {
  // Use real album cover if available, fall back to stylized
  const src = song.albumImageUrl || artDataUrl(song);
  const dims: Record<string, string> = {
    xs: "h-12 w-12",
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-56 w-56 sm:h-64 sm:w-64",
    xl: "h-72 w-72 sm:h-[22rem] sm:w-[22rem]",
  };

  return (
    <div className={`relative ${dims[size]} shrink-0`}>
      {/* Vinyl peeking out behind the sleeve */}
      <div
        className={`vinyl absolute rounded-full inset-0 ${spinning ? "spin-slow" : ""}`}
        style={{
          transform: spinning ? "translateX(22%)" : "translateX(8%)",
          transition: "transform 500ms cubic-bezier(0.2,0.8,0.2,1)",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8)",
        }}
      >
        <div className="absolute inset-[30%] rounded-full bg-gold"></div>
        <div className="absolute inset-[45%] rounded-full bg-ink"></div>
      </div>
      <img
        src={src}
        alt=""
        className="relative z-10 h-full w-full rounded-md ring-gold"
        style={{ boxShadow: "0 16px 40px -20px rgba(0,0,0,0.9)" }}
      />
    </div>
  );
}
