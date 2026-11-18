import opentype from "opentype.js";
import type { GlyphIR } from "./geometry";
import { bounds } from "./geometry";

const UNITS = 1000;
const CANVAS = 500;

function toFontPath(glyph: GlyphIR) {
  const path = new opentype.Path();
  for (const contour of glyph.contours) {
    if (contour.points.length < 3 || !contour.closed) continue;
    const pts = contour.points;
    const map = (p: {x:number;y:number}) => ({ x: p.x * 2, y: UNITS - p.y * 2 });
    const start = map(pts[0]);
    path.moveTo(start.x, start.y);
    for (let i = 1; i < pts.length; i++) {
      const p = map(pts[i]);
      path.lineTo(p.x, p.y);
    }
    path.close();
  }
  return path;
}

export function compileFont(glyphs: GlyphIR[], familyName: string): ArrayBuffer {
  const notdef = new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 600, path: new opentype.Path() });
  const space = new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 300, path: new opentype.Path() });
  const compiled = glyphs.filter(g => g.unicode !== 32).map(g => {
    const b = bounds(g);
    const path = toFontPath(g);
    return new opentype.Glyph({
      name: g.name,
      unicode: g.unicode,
      advanceWidth: g.advanceWidth,
      leftSideBearing: Math.max(0, Math.round(b.xMin * 2)),
      path
    });
  });
  const font = new opentype.Font({
    familyName,
    styleName: "Regular",
    unitsPerEm: UNITS,
    ascender: 800,
    descender: -200,
    glyphs: [notdef, space, ...compiled]
  });
  return font.toArrayBuffer();
}

export function downloadFont(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "font/ttf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ttf") ? filename : filename + ".ttf";
  a.click();
  URL.revokeObjectURL(url);
}
