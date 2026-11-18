# Plasticine

A browser glyph workshop: draw by hand, import a raster, combine both as layers, reconstruct font-oriented vectors, and compile a CFF/PostScript OTF.

## Workflow

1. Select a glyph.
2. Draw directly on the white canvas with a black or white pen, adjustable brush size, or eraser.
3. Add layers to separate construction strokes; hide, select or delete layers as needed.
4. Optionally import a raster image beneath the drawing layers, then crop to one glyph.
5. Optionally run the existing img2bez bitmap tracer. This is a legacy baseline, not the intended structural glyph-recognition system.
6. Inspect the resulting font-oriented outline, repeat for other glyphs, and compile an OTF.
7. Save the project as JSON, including editable drawing layers and reconstructed vectors.

The reconstruction input is a flattened 1024×1024 black-and-white composite of the visible source image and visible drawing layers. Hidden layers are excluded. The source image is optional. The image and tracing run locally in the browser.

## CV status

The current `img2bez` WASM path is a legacy bitmap-to-outline baseline only. It does not infer the full geometric intent of a hand-drawn glyph and must not be described as the requested CV system. See [CV model evaluation](docs/cv-model-evaluation.md) for the researched candidate architectures and integration criteria.

## Controls

- Pen / Eraser — draw black/white strokes or erase with white.
- Brush size — adjust stroke width.
- Ink color — choose black or white.
- Layers — add, select, hide and delete drawing layers.
- Open image — add an image beneath the drawing layers.
- Crop — isolate the glyph region used for reconstruction.
- Legacy bitmap trace — run img2bez on the visible composite; this does not perform structural glyph recognition.
- Source profile and threshold — tune raster interpretation.
- Findspot palette — switch among six palettes.
- Project — import/export editable vector results and drawing layers.
- Compile OTF — generate and preview the font.

## Development

    npm install
    npm run dev
    npm test
    npm run typecheck
    npm run build

The first dev/build command builds the pinned img2bez WASM package. Rust toolchain downloads and the pinned upstream source require network access.
