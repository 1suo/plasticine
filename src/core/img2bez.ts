import type { Point } from "./geometry";

type Img2BezPoint = { x: number; y: number; type?: "line" | "curve" | "qcurve" | "move"; smooth?: boolean };
type Img2BezGlyph = {
  name: string;
  advance: { width: number };
  unitsPerEm: number;
  outline: { contours: { points: Img2BezPoint[] }[] };
};
type WasmModule = {
  default: () => Promise<unknown>;
  traceToJson: (bytes: Uint8Array, config: string) => string;
};

export type TracedGlyph = { contours: Point[][]; advanceWidth: number };

const mapPoint = (point: Img2BezPoint): Point => ({
  x: point.x,
  y: 400 - point.y,
  corner: !point.smooth,
});

function lineControls(start: Point, end: Point): [Point, Point] {
  return [
    { x: start.x + (end.x - start.x) / 3, y: start.y + (end.y - start.y) / 3 },
    { x: start.x + 2 * (end.x - start.x) / 3, y: start.y + 2 * (end.y - start.y) / 3 },
  ];
}

function quadraticControls(start: Point, control: Point, end: Point): [Point, Point] {
  return [
    { x: start.x + (control.x - start.x) * 2 / 3, y: start.y + (control.y - start.y) * 2 / 3 },
    { x: end.x + (control.x - end.x) * 2 / 3, y: end.y + (control.y - end.y) * 2 / 3 },
  ];
}

function convertContour(raw: Img2BezPoint[]): Point[] {
  const onCurve = raw.map((point, index) => point.type ? index : -1).filter(index => index >= 0);
  if (onCurve.length < 2) return [];
  const anchors = onCurve.map(index => mapPoint(raw[index]));
  for (let k = 0; k < onCurve.length; k++) {
    const startIndex = onCurve[k];
    const endIndex = onCurve[(k + 1) % onCurve.length];
    const start = anchors[k];
    const end = anchors[(k + 1) % anchors.length];
    const controls: Img2BezPoint[] = [];
    for (let i = (startIndex + 1) % raw.length; i !== endIndex; i = (i + 1) % raw.length) {
      controls.push(raw[i]);
      if (controls.length > raw.length) throw new Error("Malformed img2bez contour point order");
    }
    let c1: Point, c2: Point;
    const segmentType = raw[endIndex].type;
    if (segmentType === "curve" && controls.length >= 2) {
      c1 = mapPoint(controls[0]);
      c2 = mapPoint(controls[controls.length - 1]);
    } else if ((segmentType === "qcurve" || controls.length === 1) && controls.length === 1) {
      [c1, c2] = quadraticControls(start, mapPoint(controls[0]), end);
    } else {
      [c1, c2] = lineControls(start, end);
    }
    start.segment = { kind: segmentType === "line" || controls.length === 0 ? "line" : "curve", c1, c2 };
  }
  return [...anchors, { ...anchors[0] }];
}

export function img2bezToContours(glyph: Img2BezGlyph): TracedGlyph {
  const contours = glyph.outline.contours
    .map(contour => convertContour(contour.points))
    .filter(contour => contour.length >= 4);
  if (!contours.length) throw new Error("img2bez found no closed glyph contours");
  return { contours, advanceWidth: Math.round(glyph.advance.width * 2) };
}

let wasmPromise: Promise<WasmModule> | undefined;

async function loadWasm(): Promise<WasmModule> {
  if (!wasmPromise) {
    const moduleUrl = "/img2bez/img2bez_wasm.js";
    wasmPromise = import(/* @vite-ignore */ moduleUrl) as Promise<WasmModule>;
    wasmPromise = wasmPromise.then(async wasm => {
      await wasm.default();
      return wasm;
    }).catch(error => {
      wasmPromise = undefined;
      throw error;
    });
  }
  return wasmPromise;
}

export async function traceGlyphImage(
  bytes: Uint8Array,
  unicode: number,
  threshold: number,
  profile: "wild" | "clean" | "photo",
): Promise<TracedGlyph> {
  const wasm = await loadWasm();
  const config = {
    glyph: String.fromCodePoint(unicode),
    unicode: unicode.toString(16).toUpperCase().padStart(4, "0"),
    profile,
    style: "basic",
    targetHeight: 500,
    yOffset: -100,
    grid: 2,
    threshold: Math.max(0, Math.min(255, Math.round(threshold))),
    refine: true,
    siteHead: true,
    cornerHead: false,
  };
  const result = wasm.traceToJson(bytes, JSON.stringify(config));
  return img2bezToContours(JSON.parse(result) as Img2BezGlyph);
}
