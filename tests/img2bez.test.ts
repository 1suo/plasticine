import { describe, expect, it } from "vitest";
import { img2bezToContours } from "../src/core/img2bez";
import { makeGlyph } from "../src/core/geometry";

describe("img2bez UFO point stream adapter", () => {
  it("converts line and cubic segments without losing their control points", () => {
    const traced = img2bezToContours({
      name: "a",
      advance: { width: 320 },
      unitsPerEm: 1024,
      outline: { contours: [{ points: [
        { x: 0, y: 0, type: "line" },
        { x: 100, y: 0, type: "line" },
        { x: 100, y: 30 },
        { x: 70, y: 100 },
        { x: 100, y: 100, type: "curve", smooth: true },
        { x: 0, y: 100, type: "line" },
      ] }] },
    });
    expect(traced.advanceWidth).toBe(640);
    expect(traced.contours).toHaveLength(1);
    const glyph = makeGlyph(97, traced.contours, 0.4, 1.0);
    expect(glyph.contours[0].closed).toBe(true);
    expect(glyph.contours[0].curves).toHaveLength(4);
    expect(glyph.contours[0].curves[1].p1).toEqual({ x: 100, y: 370 });
    expect(glyph.contours[0].curves[1].p2).toEqual({ x: 70, y: 300 });
  });

  it("converts quadratic segments to cubic controls", () => {
    const traced = img2bezToContours({
      name: "o",
      advance: { width: 300 },
      unitsPerEm: 1024,
      outline: { contours: [{ points: [
        { x: 0, y: 0, type: "line" },
        { x: 100, y: 0 },
        { x: 100, y: 100, type: "qcurve" },
        { x: 0, y: 100, type: "line" },
      ] }] },
    });
    const glyph = makeGlyph(111, traced.contours, 0.4, 1.0);
    const curve = glyph.contours[0].curves[0];
    expect(curve.p1).toEqual({ x: 200 / 3, y: 400 });
    expect(curve.p2).toEqual({ x: 100, y: 300 + 200 / 3 });
  });
});
