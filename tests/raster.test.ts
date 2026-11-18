import { describe, expect, it } from "vitest";
import { makeGlyph } from "../src/core/geometry";
import { fitGlyphToRaster, rasterDifference, rasterizeGlyph, type RasterMask } from "../src/core/raster";

const square = [[
  { x: 100, y: 100 }, { x: 400, y: 100 },
  { x: 400, y: 400 }, { x: 100, y: 400 }, { x: 100, y: 100 }
]];

describe("raster reconstruction objective", () => {
  it("renders a fitted glyph into a binary pixel mask", () => {
    const glyph = makeGlyph(65, square, 0.4, 0.8);
    const pixels = rasterizeGlyph(glyph, 32, 32);
    expect(pixels).toHaveLength(1024);
    expect(pixels.some(Boolean)).toBe(true);
  });

  it("reports zero disagreement against its own rasterization", () => {
    const glyph = makeGlyph(65, square, 0.4, 0.8);
    const mask: RasterMask = { width: 32, height: 32, data: rasterizeGlyph(glyph, 32, 32) };
    expect(rasterDifference(glyph, mask)).toBe(0);
  });

  it("runs whole-glyph raster fitting and returns an explicit pixel objective", () => {
    const target = makeGlyph(65, square, 0.4, 0.8);
    const mask: RasterMask = { width: 32, height: 32, data: rasterizeGlyph(target, 32, 32) };
    const result = fitGlyphToRaster(65, square, 0.4, 0.8, mask);
    expect(result.rasterError).toBeLessThanOrEqual(0.1);
    expect(result.objective).toBeGreaterThanOrEqual(result.rasterError);
    expect(result.glyph.contours.length).toBe(1);
  });

  it("uses opposite contour winding to preserve counters", () => {
    const glyph = makeGlyph(79, [
      [{ x: 80, y: 80 }, { x: 420, y: 80 }, { x: 420, y: 420 }, { x: 80, y: 420 }, { x: 80, y: 80 }],
      [{ x: 200, y: 200 }, { x: 200, y: 300 }, { x: 300, y: 300 }, { x: 300, y: 200 }, { x: 200, y: 200 }]
    ], 0.4, 0.8);
    const pixels = rasterizeGlyph(glyph, 100, 100);
    expect(pixels[15 * 100 + 15]).toBe(1);
    expect(pixels[50 * 100 + 50]).toBe(0);
  });

  it("rejects malformed reference dimensions", () => {
    const glyph = makeGlyph(65, square, 0.4, 0.8);
    expect(() => rasterDifference(glyph, { width: 32, height: 32, data: new Uint8Array(4) })).toThrow();
  });
});
