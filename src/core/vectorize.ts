import type { Point } from "./geometry";
import { traceBitmap } from "./trace";

type Segment = { kind: "line" | "curve"; c1: Point; c2: Point };
type LineFit = { angle: number; x: number; y: number; error: number };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mod = (n: number, m: number) => ((n % m) + m) % m;

function resampleClosed(points: Point[], step: number): Point[] {
  const ring = points.slice(0, -1);
  const lengths = ring.map((p, i) => distance(p, ring[(i + 1) % ring.length]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const count = Math.max(12, Math.ceil(total / step));
  const out: Point[] = [];
  let edge = 0, edgeStart = 0;
  for (let i = 0; i < count; i++) {
    const target = total * i / count;
    while (edgeStart + lengths[edge] < target && edge < lengths.length - 1) {
      edgeStart += lengths[edge++];
    }
    const a = ring[edge], b = ring[(edge + 1) % ring.length];
    const t = lengths[edge] ? (target - edgeStart) / lengths[edge] : 0;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

function smooth(points: Point[], radius = 2): Point[] {
  return points.map((_, i) => {
    let x = 0, y = 0, weight = 0;
    for (let k = -radius; k <= radius; k++) {
      const w = radius + 1 - Math.abs(k), p = points[mod(i + k, points.length)];
      x += p.x * w; y += p.y * w; weight += w;
    }
    return { x: x / weight, y: y / weight };
  });
}

function tangent(points: Point[], i: number, radius: number): Point {
  const a = points[mod(i - radius, points.length)], b = points[mod(i + radius, points.length)];
  const n = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / n, y: (b.y - a.y) / n };
}

function detectCorners(points: Point[]): number[] {
  const radius = Math.max(2, Math.min(5, Math.round(points.length / 100)));
  const candidates: { i: number; strength: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = tangent(points, i - radius, radius), b = tangent(points, i + radius, radius);
    const turn = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y)));
    if (turn > 0.58) candidates.push({ i, strength: turn });
  }
  candidates.sort((a, b) => b.strength - a.strength);
  const selected: number[] = [];
  const separation = Math.max(5, Math.round(points.length * 0.012));
  for (const c of candidates) {
    if (selected.every(i => Math.min(mod(c.i - i, points.length), mod(i - c.i, points.length)) > separation)) selected.push(c.i);
  }
  return selected.sort((a, b) => a - b);
}

function fitLine(points: Point[]): LineFit {
  const mean = points.reduce((s, p) => ({ x: s.x + p.x / points.length, y: s.y + p.y / points.length }), { x: 0, y: 0 });
  let xx = 0, xy = 0, yy = 0;
  for (const p of points) { const x = p.x - mean.x, y = p.y - mean.y; xx += x * x; xy += x * y; yy += y * y; }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  const nx = -Math.sin(angle), ny = Math.cos(angle);
  const error = Math.max(...points.map(p => Math.abs((p.x - mean.x) * nx + (p.y - mean.y) * ny)));
  return { angle, x: mean.x, y: mean.y, error };
}

function nearestAxis(angle: number, tolerance = 0.25): "horizontal" | "vertical" | null {
  const a = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));
  if (Math.min(a, Math.abs(Math.PI - a)) < tolerance) return "horizontal";
  if (Math.abs(a - Math.PI / 2) < tolerance) return "vertical";
  return null;
}

function fitCubic(samples: Point[], p0: Point, p3: Point): Segment {
  const unit = (a: Point, b: Point): Point => {
    const n = distance(a, b) || 1;
    return { x: (b.x - a.x) / n, y: (b.y - a.y) / n };
  };
  const t0 = unit(p0, samples[Math.min(4, samples.length - 1)]);
  const t1 = unit(samples[Math.max(0, samples.length - 5)], p3);
  const ts: number[] = [0];
  let length = 0;
  for (let i = 1; i < samples.length; i++) { length += distance(samples[i - 1], samples[i]); ts.push(length); }
  for (let i = 0; i < ts.length; i++) ts[i] = length ? ts[i] / length : i / (ts.length - 1);
  let aa = 0, ab = 0, bb = 0, ar = 0, br = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = ts[i], u = 1 - t, b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
    const rx = samples[i].x - b0 * p0.x - b3 * p3.x - (b1 + b2) * (p0.x + p3.x) / 2;
    const ry = samples[i].y - b0 * p0.y - b3 * p3.y - (b1 + b2) * (p0.y + p3.y) / 2;
    const a = { x: b1 * t0.x, y: b1 * t0.y }, b = { x: -b2 * t1.x, y: -b2 * t1.y };
    aa += a.x * a.x + a.y * a.y; ab += a.x * b.x + a.y * b.y; bb += b.x * b.x + b.y * b.y;
    ar += a.x * rx + a.y * ry; br += b.x * rx + b.y * ry;
  }
  const det = aa * bb - ab * ab;
  let alpha0 = det > 1e-8 ? (ar * bb - br * ab) / det : length / 3;
  let alpha1 = det > 1e-8 ? (br * aa - ar * ab) / det : length / 3;
  alpha0 = Math.max(0, Math.min(length, alpha0)); alpha1 = Math.max(0, Math.min(length, alpha1));
  return { kind: "curve", c1: { x: p0.x + t0.x * alpha0, y: p0.y + t0.y * alpha0 }, c2: { x: p3.x - t1.x * alpha1, y: p3.y - t1.y * alpha1 } };
}

function segmentSamples(points: Point[], start: number, end: number): Point[] {
  const out: Point[] = [];
  for (let i = start; i <= end; i++) out.push(points[mod(i, points.length)]);
  return out;
}

function findSymmetryAxis(mask: Uint8Array, width: number, height: number, axis: "x" | "y"): number | null {
  const extent = axis === "x" ? width : height;
  const other = axis === "x" ? height : width;
  let best = extent / 2, bestError = Infinity;
  for (let center = extent * 0.38; center <= extent * 0.62; center += 0.5) {
    let mismatches = 0, comparisons = 0;
    for (let b = 0; b < other; b++) for (let a = 0; a < extent; a++) {
      const mirror = Math.round(2 * center - a);
      if (mirror <= a || mirror < 0 || mirror >= extent) continue;
      const left = axis === "x" ? mask[b * width + a] : mask[a * width + b];
      const right = axis === "x" ? mask[b * width + mirror] : mask[mirror * width + b];
      if (left !== right) mismatches++;
      comparisons++;
    }
    const error = comparisons ? mismatches / comparisons : 1;
    if (error < bestError) { bestError = error; best = center; }
  }
  return bestError < 0.035 ? best * 500 / extent : null;
}

function enforceSymmetry(loops: Point[][], axis: "x" | "y", center: number): void {
  const points = loops.flatMap(loop => loop.slice(0, -1));
  const before = points.map(point => ({ x: point.x, y: point.y }));
  const used = new Set<number>();
  for (let i = 0; i < points.length; i++) {
    if (used.has(i) || Math.abs(points[i][axis] - center) < 2.5) continue;
    const target = 2 * center - points[i][axis];
    let best = -1, bestDistance = 6;
    for (let j = 0; j < points.length; j++) {
      if (j === i || used.has(j)) continue;
      const across = Math.abs(points[j][axis] - target);
      const along = Math.abs(points[j][axis === "x" ? "y" : "x"] - points[i][axis === "x" ? "y" : "x"]);
      const score = Math.hypot(across, along);
      if (score < bestDistance) { bestDistance = score; best = j; }
    }
    if (best < 0) continue;
    const value = (points[i][axis] + 2 * center - points[best][axis]) / 2;
    points[i][axis] = value;
    points[best][axis] = 2 * center - value;
    used.add(i); used.add(best);
  }
  let offset = 0;
  for (const loop of loops) {
    const ring = loop.slice(0, -1);
    for (let i = 0; i < ring.length; i++) {
      const point = ring[i], next = ring[(i + 1) % ring.length];
      const old = before[offset + i], oldNext = before[offset + (i + 1) % ring.length];
      if (point.segment) {
        point.segment.c1 = { x: point.segment.c1.x + point.x - old.x, y: point.segment.c1.y + point.y - old.y };
        point.segment.c2 = { x: point.segment.c2.x + next.x - oldNext.x, y: point.segment.c2.y + next.y - oldNext.y };
      }
    }
    loop[loop.length - 1] = { ...ring[0] };
    offset += ring.length;
  }
}

function snapGrid(loops: Point[][], tolerance = 1.2): Point[][] {
  const points = loops.flatMap(loop => loop.slice(0, -1));
  const before = points.map(point => ({ x: point.x, y: point.y }));
  const align = (axis: "x" | "y") => {
    const ordered = points.map((point, index) => ({ index, value: point[axis] })).sort((a, b) => a.value - b.value);
    for (let start = 0; start < ordered.length;) {
      let end = start + 1;
      while (end < ordered.length && ordered[end].value - ordered[end - 1].value <= tolerance) end++;
      if (end - start > 1) {
        const mean = ordered.slice(start, end).reduce((sum, item) => sum + item.value, 0) / (end - start);
        for (let i = start; i < end; i++) points[ordered[i].index][axis] = mean;
      }
      start = end;
    }
  };
  align("x");
  align("y");
  let offset = 0;
  for (const loop of loops) {
    const ring = loop.slice(0, -1);
    for (let i = 0; i < ring.length; i++) {
      const point = ring[i], next = ring[(i + 1) % ring.length];
      const old = before[offset + i], oldNext = before[offset + (i + 1) % ring.length];
      if (point.segment) {
        point.segment.c1 = { x: point.segment.c1.x + point.x - old.x, y: point.segment.c1.y + point.y - old.y };
        point.segment.c2 = { x: point.segment.c2.x + next.x - oldNext.x, y: point.segment.c2.y + next.y - oldNext.y };
      }
    }
    loop[loop.length - 1] = { ...ring[0] };
    offset += ring.length;
  }
  return loops;
}

/** CV reconstruction: contour conditioning, corner/junction detection, line-vs-curve classification,
 * orthogonal snapping and least-squares cubic fitting. Pixel edges are observations, never output geometry. */
export function vectorizeBitmap(mask: Uint8Array, width: number, height: number): Point[][] {
  const traced = traceBitmap(mask, width, height);
  const loops = traced.map(loop => {
    const samples = smooth(resampleClosed(loop, 2.2));
    let corners = detectCorners(samples);
    if (corners.length < 3) {
      corners = [0, 1, 2, 3].map(k => {
        const target = k * Math.PI / 2;
        let best = 0, score = -Infinity;
        for (let i = 0; i < samples.length; i++) {
          const p = samples[i], c = Math.cos(target) * (p.x - 250) + Math.sin(target) * (p.y - 250);
          if (c > score) { score = c; best = i; }
        }
        return best;
      }).sort((a, b) => a - b).filter((v, i, a) => !i || v !== a[i - 1]);
    }
    if (corners.length < 3) return [];
    const spans = corners.map((start, i) => {
      const end = corners[(i + 1) % corners.length] + (i === corners.length - 1 ? samples.length : 0);
      const pts = segmentSamples(samples, start, end);
      const trim = Math.floor(pts.length * 0.16);
      const line = fitLine(pts.slice(trim, Math.max(trim + 2, pts.length - trim)));
      const axis = nearestAxis(line.angle);
      return { pts, line, axis, straight: line.error < 1.6 };
    });
    const snapped = corners.map((corner, i) => {
      const previous = spans[(i - 1 + spans.length) % spans.length];
      const next = spans[i];
      const original = samples[corner];
      let x = original.x, y = original.y;
      if (previous.straight && previous.axis === "vertical") x = previous.line.x;
      if (next.straight && next.axis === "vertical") x = next.line.x;
      if (previous.straight && previous.axis === "horizontal") y = previous.line.y;
      if (next.straight && next.axis === "horizontal") y = next.line.y;
      return { x, y };
    });
    const anchors: (Point & { corner?: boolean; segment?: Segment })[] = snapped.map(p => ({ ...p, corner: true }));
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i], p0 = snapped[i], p1 = snapped[(i + 1) % snapped.length];
      if (span.straight) {
        anchors[i].segment = { kind: "line", c1: { x: p0.x + (p1.x - p0.x) / 3, y: p0.y + (p1.y - p0.y) / 3 }, c2: { x: p0.x + 2 * (p1.x - p0.x) / 3, y: p0.y + 2 * (p1.y - p0.y) / 3 } };
      } else {
        anchors[i].segment = fitCubic(span.pts, p0, p1);
      }
    }
    return [...anchors, { ...anchors[0] }];
  }).filter(loop => loop.length >= 3);
  const gridAligned = snapGrid(loops);\n  const verticalAxis = findSymmetryAxis(mask, width, height, "x");\n  const horizontalAxis = findSymmetryAxis(mask, width, height, "y");\n  if (verticalAxis !== null) enforceSymmetry(gridAligned, "x", verticalAxis);\n  if (horizontalAxis !== null) enforceSymmetry(gridAligned, "y", horizontalAxis);\n  return gridAligned;
}
