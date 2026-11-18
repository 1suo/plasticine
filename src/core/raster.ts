import { fitContour, type Cubic, type GlyphIR, type Point } from "./geometry";

export type RasterMask = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type RasterFit = {
  glyph: GlyphIR;
  rasterError: number;
  objective: number;
};

const TOLERANCES = [0.5, 0.8, 1, 1.5, 2, 3, 4, 6, 8, 10, 12];
const GRID = 128;

function sample(c: Cubic, t: number): Point {
  const u = 1 - t;
  return {
    x: u*u*u*c.p0.x + 3*u*u*t*c.p1.x + 3*u*t*t*c.p2.x + t*t*t*c.p3.x,
    y: u*u*u*c.p0.y + 3*u*u*t*c.p1.y + 3*u*t*t*c.p2.y + t*t*t*c.p3.y
  };
}

function flattened(contours: GlyphIR["contours"]): Point[][] {
  return contours.map(contour => {
    const points: Point[] = [];
    for (const curve of contour.curves) {
      for (let step = 0; step < 8; step++) points.push(sample(curve, step / 8));
    }
    return points;
  }).filter(points => points.length >= 3);
}

function insideEvenOdd(x: number, y: number, paths: Point[][]): boolean {
  let inside = false;
  for (const path of paths) {
    for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
      const a = path[i], b = path[j];
      if ((a.y > y) !== (b.y > y) &&
          x < (b.x - a.x) * (y - a.y) / ((b.y - a.y) || 1e-12) + a.x) inside = !inside;
    }
  }
  return inside;
}

export function rasterizeGlyph(glyph: GlyphIR, width = GRID, height = GRID): Uint8Array {
  const paths = flattened(glyph.contours);
  const output = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const gy = (y + 0.5) * 500 / height;
    for (let x = 0; x < width; x++) {
      if (insideEvenOdd((x + 0.5) * 500 / width, gy, paths)) output[y * width + x] = 1;
    }
  }
  return output;
}

export function rasterDifference(glyph: GlyphIR, reference: RasterMask): number {
  if (reference.data.length !== reference.width * reference.height || !reference.width || !reference.height) {
    throw new Error("Invalid raster mask dimensions");
  }
  const rendered = rasterizeGlyph(glyph, reference.width, reference.height);
  let different = 0;
  for (let i = 0; i < rendered.length; i++) if (rendered[i] !== (reference.data[i] ? 1 : 0)) different++;
  return different / rendered.length;
}

/** Coordinate descent over per-contour simplification candidates using a whole-glyph raster objective. */
export function fitGlyphToRaster(
  unicode: number,
  rawContours: Point[][],
  simplicity: number,
  tension: number,
  reference: RasterMask
): RasterFit {
  if (!rawContours.length) {
    const empty: GlyphIR = { unicode, name: String.fromCodePoint(unicode), advanceWidth: 700, contours: [], fitError: 0, objective: 0 };
    return { glyph: empty, rasterError: rasterDifference(empty, reference), objective: rasterDifference(empty, reference) };
  }
  const candidates = rawContours.map(raw => TOLERANCES.map(tolerance => fitContour(raw, tolerance, tension))
    .filter(contour => contour.points.length > 2));
  const selected = candidates.map(options => options.reduce((best, option) =>
    option.curves.length < best.curves.length ? option : best, options[0]));
  const build = (): GlyphIR => ({
    unicode,
    name: String.fromCodePoint(unicode),
    advanceWidth: 700,
    contours: selected,
    fitError: 0,
    objective: 0
  });
  const score = (glyph: GlyphIR) => rasterDifference(glyph, reference) +
    simplicity * glyph.contours.reduce((sum, contour) => sum + contour.curves.length, 0) * 0.0005;

  for (let pass = 0; pass < 2; pass++) {
    let changed = false;
    for (let index = 0; index < candidates.length; index++) {
      let best = selected[index];
      let bestScore = score(build());
      for (const candidate of candidates[index]) {
        selected[index] = candidate;
        const candidateScore = score(build());
        if (candidateScore < bestScore) {
          best = candidate;
          bestScore = candidateScore;
        }
      }
      selected[index] = best;
      if (best !== candidates[index][0]) changed = true;
    }
    if (!changed) break;
  }
  const glyph = build();
  const rasterError = rasterDifference(glyph, reference);
  const complexity = glyph.contours.reduce((sum, contour) => sum + contour.curves.length, 0);
  const objective = rasterError + simplicity * complexity * 0.0005;
  glyph.objective = objective;
  return { glyph, rasterError, objective };
}
