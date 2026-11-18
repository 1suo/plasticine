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
3. Adjust the simplicity penalty and curve tension. Raw source contours remain preserved.
4. Inspect the inferred cubic path in Vector view.
5. Compile a CFF/PostScript OTF, load it into the live specimen and download it.
6. Export the editable project JSON to preserve source contours.

## Architecture and research

- **Input:** pointer-sampled contours in glyph coordinates.
- **Inference:** candidate simplification plus Catmull–Rom-to-cubic fitting.
- **Objective:** sampled geometric fidelity + explicit segment-count penalty. This is a geometric proxy, not yet a raster loss.
- **Canonical IR:** Unicode identity, advance width, contours and cubic Bézier segments.
- **Compiler:** opentype.js emits CFF/PostScript OTF, retaining cubic curves.
- **Proof:** browser `FontFace` loads the generated OTF and specimen text uses that loaded face.

See [architecture](docs/architecture.md), [research assessment](docs/research.md), [end-to-end journey](docs/journey.md) and [acceptance checklist](docs/acceptance.md).

## Current scope

This is an initial vertical slice, not a finished type-design suite. Raster-image reconstruction, discrete topology search, editable Bézier handles, per-glyph metrics, anchors, kerning, font QA, WOFF2/TTF backends and learned inference are follow-on milestones. See the journey document for implemented versus outstanding steps.
