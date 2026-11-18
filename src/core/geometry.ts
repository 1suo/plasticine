export type Point = { x: number; y: number };
export type Cubic = { p0: Point; p1: Point; p2: Point; p3: Point };
export type Contour = { points: Point[]; closed: boolean };
export type GlyphIR = {
  unicode: number;
  name: string;
  advanceWidth: number;
  contours: Contour[];
  cubics: Cubic[];
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  const first = points[0], last = points[points.length - 1];
  let max = 0, index = 0;
  const dx = last.x - first.x, dy = last.y - first.y;
  const denom = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const d = Math.abs(dy * points[i].x - dx * points[i].y + last.x * first.y - last.y * first.x) / denom;
    if (d > max) { max = d; index = i; }
  }
  if (max <= tolerance) return [first, last];
  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

export function fitContour(raw: Point[], tolerance: number, smoothness: number): Contour {
  const deduped = raw.filter((p, i) => i === 0 || distance(p, raw[i - 1]) > 1.2);
  if (deduped.length < 3) return { points: deduped, closed: false };
  const closed = distance(deduped[0], deduped[deduped.length - 1]) < 24;
  const points = simplify(deduped, tolerance);
  if (closed && distance(points[0], points[points.length - 1]) > 0.5) points.push(points[0]);
  return { points: smoothPolyline(points, smoothness), closed };
}

function smoothPolyline(points: Point[], amount: number): Point[] {
  if (points.length < 3 || amount <= 0) return points;
  const out: Point[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i];
    const c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    const steps = Math.max(2, Math.ceil(distance(b, c) / 12));
    for (let j = 1; j <= steps; j++) {
      const t = j / steps, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * ((2 * b.x) + (-a.x + c.x) * t + (2*a.x - 5*b.x + 4*c.x - d.x)*t2 + (-a.x+3*b.x-3*c.x+d.x)*t3);
      const y = 0.5 * ((2 * b.y) + (-a.y + c.y) * t + (2*a.y - 5*b.y + 4*c.y - d.y)*t2 + (-a.y+3*b.y-3*c.y+d.y)*t3);
      out.push({ x: b.x + (x - b.x) * amount, y: b.y + (y - b.y) * amount });
    }
  }
  return out;
}

export function contourToPath(contour: Contour): string {
  if (!contour.points.length) return "";
  const [first, ...rest] = contour.points;
  return `M ${first.x} ${first.y} ${rest.map(p => `L ${p.x} ${p.y}`).join(" ")} ${contour.closed ? "Z" : ""}`;
}

export function makeGlyph(unicode: number, rawContours: Point[][], tolerance: number, smoothness: number): GlyphIR {
  const contours = rawContours.map(points => fitContour(points, tolerance, smoothness)).filter(c => c.points.length > 2);
  return { unicode, name: unicode === 32 ? "space" : String.fromCodePoint(unicode), advanceWidth: 700, contours, cubics: [] };
}

export function glyphPathData(glyph: GlyphIR): string {
  return glyph.contours.map(contourToPath).join(" ");
}

export function countSegments(glyph: GlyphIR): number {
  return glyph.contours.reduce((n, c) => n + Math.max(0, c.points.length - 1), 0);
}

export function bounds(glyph: GlyphIR) {
  const points = glyph.contours.flatMap(c => c.points);
  if (!points.length) return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  return {
    xMin: Math.min(...points.map(p => p.x)),
    xMax: Math.max(...points.map(p => p.x)),
    yMin: Math.min(...points.map(p => p.y)),
    yMax: Math.max(...points.map(p => p.y))
  };
}
