# Plasticine

**A browser-based glyph reconstruction and font laboratory.**

Draw glyph contours, infer compact cubic geometry, compile native CFF/PostScript OpenType fonts, and test the compiled font in a live browser specimen.

## Run locally

```sh
npm install
npm run dev
```

## Workflow

1. Select a glyph from the Latin uppercase/lowercase and digit inventory.
2. Draw closed silhouette contours. Draw counters/holes in the opposite direction.
3. Optionally import a dark-on-light raster glyph reference. The image is thresholded locally and used as a binary pixel target; the original contours remain preserved.
4. Adjust the simplicity penalty and curve tension. Without a reference, fitting uses geometric point-set distance; with one, coordinate descent minimizes whole-glyph pixel disagreement plus a segment-count penalty.
5. Inspect the inferred cubic path in Vector view.
6. Compile a CFF/PostScript OTF, load it into the live specimen and download it.
7. Export the editable project JSON to preserve source contours.

## Architecture and research

- **Input:** pointer-sampled contours in glyph coordinates.
- **Inference:** candidate simplification plus Catmull–Rom-to-cubic fitting.
- **Objective:** geometric point-set fitting by default; optional 128×128 binary raster disagreement + explicit segment-count penalty when a reference image is loaded. This is not DiffVG.
- **Canonical IR:** Unicode identity, advance width, contours and cubic Bézier segments.
- **Compiler:** opentype.js emits CFF/PostScript OTF, retaining cubic curves.
- **Proof:** browser `FontFace` loads the generated OTF and specimen text uses that loaded face.

See [architecture](docs/architecture.md), [research assessment](docs/research.md), [end-to-end journey](docs/journey.md) and [acceptance checklist](docs/acceptance.md).

## Current scope

This is an initial vertical slice, not a finished type-design suite. Antialiased and multiscale raster optimization, discrete topology search, editable Bézier handles, per-glyph metrics, anchors, kerning, font QA, WOFF2/TTF backends and learned inference are follow-on milestones. See the journey document for implemented versus outstanding steps.
