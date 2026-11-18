# Plasticine

A browser glyph workshop: draw by hand, import a raster, combine both as layers, reconstruct font-oriented vectors, and compile a CFF/PostScript OTF.

## Workflow

1. Select a glyph.
2. Draw directly on the white canvas with a black or white pen, adjustable brush size, or eraser.
3. Add layers to separate construction strokes; hide, select or delete layers as needed.
4. Optionally import a raster image beneath the drawing layers, then crop to one glyph.
5. Reconstruct the visible black-and-white composite with img2bez.
6. Inspect the resulting font-oriented outline, repeat for other glyphs, and compile an OTF.
7. Save the project as JSON, including editable drawing layers and reconstructed vectors.

The reconstruction input is a flattened 1024×1024 black-and-white composite of the visible source image and visible drawing layers. Hidden layers are excluded. The source image is optional. The image and tracing run locally in the browser.

## Reconstruction engine

Plasticine uses [img2bez](https://github.com/fontgarden/img2bez), a type-design-specific Rust vectorizer compiled to WebAssembly. It is pinned to upstream commit `278aa3683f1e7243158c82b1bdcdafec6436cfc6`.

The pipeline extracts subpixel boundaries from grayscale antialiasing, identifies corners/extrema/tangent points/inflections, fits compact line and cubic Bézier segments, constrains horizontal/vertical handles, snaps to a design grid, refines against the source raster and corrects contour winding.

Plasticine enables img2bez's optional learned site-classification head in WASM. The upstream project reports a 0.964 mean structural score on its own basic-Latin reference-font evaluation; this is not a Plasticine benchmark.

## Controls

- Pen / Eraser — draw black/white strokes or erase with white.
- Brush size — adjust stroke width.
- Ink color — choose black or white.
- Layers — add, select, hide and delete drawing layers.
- Open image — add an image beneath the drawing layers.
- Crop — isolate the glyph region used for reconstruction.
- Reconstruct visible layers — run img2bez on the composited result.
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
