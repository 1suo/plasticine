# Plasticine

**A browser-based glyph reconstruction and font laboratory.**

Draw glyph contours, infer compact cubic geometry, compile native CFF/PostScript OpenType fonts, and test the actual compiled font in a live browser specimen.

## Run locally

```sh
npm install
npm run dev
```

## Workflow

1. Select a glyph from the character set.
2. Draw closed silhouette contours. Draw counters/holes in the opposite direction.
3. Adjust approximation tolerance and curve tension; raw source contours remain preserved.
4. Inspect the inferred cubic path in Vector view.
5. Compile a CFF/PostScript OTF and test it in the live specimen.
6. Export the editable project JSON to preserve source contours.

## Architecture

- **Input:** pointer-sampled contours in glyph coordinates.
- **Baseline inference:** Ramer–Douglas–Peucker simplification and Catmull–Rom-to-cubic fitting.
- **Canonical IR:** Unicode identity, advance width, contours and cubic Bézier segments.
- **Compiler:** opentype.js emits OpenType CFF outlines, retaining cubic curves.
- **Proof:** browser `FontFace` loads the generated OTF and specimen text uses that loaded face.

See [architecture](docs/architecture.md) and [acceptance checklist](docs/acceptance.md).

## Research direction

The deterministic fitter is a working baseline, not a claim to implement the cited neural research. The next reconstruction milestone is a raster-aware objective combining image fidelity with explicit primitive/segment complexity, then a discrete topology proposal stage. DiffVG-style differentiable rendering can optimize continuous parameters, while split/merge decisions need separate search.

## Current scope

This is an initial test application, not a finished type-design suite. Per-glyph metrics, editable Bézier handles, robust winding/topology validation, kerning, font QA, WOFF2 and learned reconstruction backends remain to be implemented.
