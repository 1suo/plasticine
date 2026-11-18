import type { Point } from "./geometry";

type Edge = { a: Point; b: Point; used: boolean };
const key = (p: Point) => `${p.x},${p.y}`;

/** Trace the pixel boundary graph. Each foreground pixel contributes only exposed edges. */
export function traceBitmap(mask: Uint8Array, width: number, height: number): Point[][] {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || mask.length !== width * height) {
    throw new Error("Invalid bitmap dimensions");
  }
  const ink = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] !== 0;
  const edges: Edge[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!ink(x, y)) continue;
    if (!ink(x, y - 1)) edges.push({ a: { x, y }, b: { x: x + 1, y }, used: false });
    if (!ink(x + 1, y)) edges.push({ a: { x: x + 1, y }, b: { x: x + 1, y: y + 1 }, used: false });
    if (!ink(x, y + 1)) edges.push({ a: { x: x + 1, y: y + 1 }, b: { x, y: y + 1 }, used: false });
    if (!ink(x - 1, y)) edges.push({ a: { x, y: y + 1 }, b: { x, y }, used: false });
  }
  const outgoing = new Map<string, number[]>();
  edges.forEach((edge, index) => {
    const k = key(edge.a);
    const list = outgoing.get(k) ?? [];
    list.push(index);
    outgoing.set(k, list);
  });
  const loops: Point[][] = [];
  for (let start = 0; start < edges.length; start++) {
    if (edges[start].used) continue;
    const points: Point[] = [];
    let current = start;
    const first = key(edges[start].a);
    let guard = 0;
    while (!edges[current].used && guard++ <= edges.length + 1) {
      const edge = edges[current];
      edge.used = true;
      points.push(edge.a);
      const end = key(edge.b);
      if (end === first) break;
      const candidates = (outgoing.get(end) ?? []).filter(i => !edges[i].used);
      if (!candidates.length) break;
      const dx = edge.b.x - edge.a.x, dy = edge.b.y - edge.a.y;
      const turnScore = (i: number) => {
        const next = edges[i], nx = next.b.x - next.a.x, ny = next.b.y - next.a.y;
        const cross = dx * ny - dy * nx, dot = dx * nx + dy * ny;
        return cross > 0 ? 3 : dot > 0 ? 2 : cross < 0 ? 1 : 0;
      };
      current = candidates.sort((a, b) => turnScore(b) - turnScore(a))[0];
    }
    if (points.length >= 3 && key(edges[(current === start ? start : start)].a) === first) {
      const scaled = points.map(p => ({ x: p.x / width * 500, y: p.y / height * 500 }));
      loops.push([...scaled, scaled[0]]);
    }
  }
  return loops;
}
