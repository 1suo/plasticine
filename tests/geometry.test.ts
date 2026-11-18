import { describe, expect, it } from "vitest";
import opentype from "opentype.js";
import { makeGlyph, countSegments } from "../src/core/geometry";
import { compileFont } from "../src/core/font";

describe("glyph geometry", () => {
  it("fits a closed contour as cubic segments", () => {
    const glyph = makeGlyph(65, [[
      { x: 100, y: 400 }, { x: 250, y: 100 }, { x: 400, y: 400 }, { x: 100, y: 400 }
    ]], 0.5, 0.8);
    expect(glyph.contours).toHaveLength(1);
    expect(glyph.contours[0].closed).toBe(true);
    expect(glyph.contours[0].curves.length).toBeGreaterThanOrEqual(3);
    expect(countSegments(glyph)).toBeGreaterThanOrEqual(3);
  });

  it("keeps disconnected contours as separate subpaths", () => {
    const glyph = makeGlyph(8, [
      [{ x: 100, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 180 }, { x: 100, y: 80 }],
      [{ x: 100, y: 280 }, { x: 200, y: 280 }, { x: 200, y: 380 }, { x: 100, y: 280 }]
    ], 0.5, 0.7);
    expect(glyph.contours).toHaveLength(2);\n    expect(glyph.objective).toBeGreaterThanOrEqual(glyph.fitError);
  });

  it("compiles native cubic contours into a parseable CFF OpenType font", () => {
    const glyph = makeGlyph(65, [[
      { x: 100, y: 400 }, { x: 250, y: 100 }, { x: 400, y: 400 }, { x: 100, y: 400 }
    ]], 0.5, 0.8);
    const bytes = compileFont([glyph], "Plasticine Test");
    expect(new TextDecoder().decode(new Uint8Array(bytes).slice(0, 4))).toBe("OTTO");
    const parsed = opentype.parse(bytes);
    expect(parsed.outlinesFormat).toBe("cff");
    expect(parsed.charToGlyph("A").path.commands.some(command => command.type === "C")).toBe(true);
  });
});
