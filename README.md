# Plasticine

Image-first glyph reconstruction and CFF font compilation in the browser.

## Workflow

1. Open a raster image containing a glyph.
2. Crop around the glyph.
3. Adjust the foreground threshold and reconstruct.
4. Inspect the font-oriented vector outline, then repeat for other characters.
5. Compile a CFF/PostScript OTF and test it in the specimen.
6. Save the editable project as JSON.

The image and tracing run locally in the browser. No remote inference service is used.

## Reconstruction engine

Plasticine uses [img2bez](https://github.com/fontgarden/img2bez), a type-design-specific Rust vectorizer compiled to WebAssembly. It is pinned to upstream commit `278aa3683f1e7243158c82b1bdcdafec6436cfc6`.

The pipeline:
- extracts subpixel boundaries from grayscale antialiasing rather than flattening the image to a binary pixel edge;
- identifies corners, extrema, tangent points and inflections;
- fits a minimal set of line and cubic Bézier segments with font-oriented point placement;
- constrains horizontal/vertical handles, harmonizes smooth joins and snaps coordinates to a design grid;
- refines geometry against the source raster and corrects contour winding/counters.

Plasticine enables img2bez's optional learned site-classification head in WASM. The geometry itself remains procedural and deterministic; the learned head makes structural decisions. The upstream project reports a 0.964 mean structural score over basic Latin a–z, A–Z and 0–9 on its own reference-font evaluation. This is an upstream result, not a Plasticine benchmark.

The adapter preserves img2bez's UFO point semantics and converts its line/cubic/quadratic segments into Plasticine's glyph IR. See [architecture](docs/architecture.md) and [research](docs/research.md).

## Controls

- Open image — load a browser-decodable raster.
- Crop — select one glyph in the image stage.
- Source profile — choose wild raster, clean font render or photo scan.
- Threshold — set the grayscale foreground threshold.
- Reconstruct — run img2bez's font-aware vectorization and raster refinement.
- Curve tension — adjust inferred cubic handles.
- Findspot palette — switch among the six palettes from 1suo/findspot.
- Project — import/export glyph geometry and advances.
- Compile OTF — generate and preview the font.

## Development

    npm install
    npm run dev
    npm test
    npm run typecheck
    npm run build

The first `npm run dev` or `npm run build` installs the pinned Rust toolchain if needed, builds the img2bez WASM package, and copies it into the Vite public assets. Requires network access to fetch Rust components and the pinned img2bez source.
