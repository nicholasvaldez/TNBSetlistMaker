export interface Moment {
  id: string;
  label: string;
  glyph: string;
}

export const MOMENTS: Moment[] = [
  { id: "processional", label: "Processional", glyph: "\u2661" },
  { id: "firstdance", label: "First dance", glyph: "\u2756" },
  { id: "fatherdaughter", label: "Father/daughter", glyph: "\u265b" },
  { id: "motherson", label: "Mother/son", glyph: "\u265c" },
  { id: "cocktail", label: "Cocktail hour", glyph: "\u25d0" },
  { id: "dinner", label: "Dinner", glyph: "\u2726" },
  { id: "openfloor", label: "Open the floor", glyph: "\u25b2" },
  { id: "lastsong", label: "Last song", glyph: "\u263e" },
];
