import { describe, expect, it } from "vitest";
import { vectorizeBitmap } from "../src/core/vectorize";
import { makeGlyph } from "../src/core/geometry";

describe("feature-based raster vectorization", () => {
  it("reconstructs an orthogonal rectangle as four clean line primitives", () => {
    const width = 64, height = 64, mask = new Uint8Array(width * height);
    for (let y = 12; y < 52; y++) for (let x = 18; x < 46; x++) mask[y * width + x] = 1;
    const loops = vectorizeBitmap(mask, width, height);
    expect(loops).toHaveLength(1);
    expect(loops[0][0]).toEqual(loops[0][loops[0].length - 1]);
    const glyph = makeGlyph(65, loops, 0.4, 0.8);
    expect(glyph.contours).toHaveLength(1);
    expect(glyph.contours[0].closed).toBe(true);
    expect(glyph.contours[0].curves).toHaveLength(4);
    for (const curve of glyph.contours[0].curves) {
      const dx = curve.p3.x - curve.p0.x, dy = curve.p3.y - curve.p0.y;
      expect(Math.min(Math.abs(dx), Math.abs(dy))).toBeLessThan(0.01);
      if (Math.abs(dx) > Math.abs(dy)) {
        expect(curve.p1.y).toBeCloseTo(curve.p0.y, 5);
        expect(curve.p2.y).toBeCloseTo(curve.p3.y, 5);
      } else {
        expect(curve.p1.x).toBeCloseTo(curve.p0.x, 5);
        expect(curve.p2.x).toBeCloseTo(curve.p3.x, 5);
      }
    }
  });

  it("represents a smooth ring with cubic curves and preserves its counter", () => {
    const width = 80, height = 80, mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - 40, y - 40);
      if (d < 25 && d > 12) mask[y * width + x] = 1;
    }
    const loops = vectorizeBitmap(mask, width, height);
    expect(loops).toHaveLength(2);
    const glyph = makeGlyph(79, loops, 0.4, 0.8);
    expect(glyph.contours).toHaveLength(2);
    expect(glyph.contours.every(c => c.closed)).toBe(true);
    expect(glyph.contours.flatMap(c => c.curves).some(c => Math.hypot(c.p1.x - c.p0.x, c.p1.y - c.p0.y) > 1)).toBe(true);
  });
});
