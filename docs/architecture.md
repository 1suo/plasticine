# Architecture

Plasticine is an image-first glyph reconstruction and CFF font compilation tool. It embeds the font-specific [img2bez](https://github.com/fontgarden/img2bez) Rust engine through its upstream WebAssembly bindings.

## Pipeline

1. Upload a raster and select a glyph crop.
2. Resample the crop to a 1024×1024 grayscale PNG while preserving its aspect ratio.
3. Pass the original grayscale edge information and the selected threshold to img2bez WASM. The learned site head is enabled.
4. img2bez extracts subpixel boundaries from antialiased pixels.
5. It detects structural features: corners, extrema, tangent points and inflections.
6. It proposes and fits a compact set of lines and cubic curves, constraining handles to horizontal/vertical directions at extrema.
7. It refines the vector against the source raster, merges unnecessary segments, restores stroke junction flats, harmonizes smooth joins and snaps coordinates to a grid.
8. It fixes contour winding so counters remain holes.
9. Plasticine converts the UFO-ordered on/off-curve point stream to its cubic Glyph IR, then compiles CFF/PostScript OTF.

## Model and runtime

- Upstream engine: `fontgarden/img2bez`, pinned to commit `278aa3683f1e7243158c82b1bdcdafec6436cfc6`.
- Runtime: browser WebAssembly; no inference server, GPU or remote image upload.
- Learned component: `siteHead: true`, the upstream four-class structural site head. The separate corner head remains disabled.
- The rest of the pipeline is procedural: subpixel extraction, feature placement, constrained Bézier fitting, raster-loss refinement, grid snapping and contour cleanup.
- WASM is built from `wasm/Cargo.toml` by `scripts/build-wasm.mjs`; `predev` and `prebuild` ensure assets exist before Vite starts or builds.
- Upstream license is Apache-2.0 OR MIT; the Rust wrapper retains the upstream SPDX notice.

## Geometry adapter

img2bez emits UFO point order: off-curve controls precede the on-curve point they lead into, and the first on-curve point carries the closing segment type. Plasticine converts each segment into a cubic:
- lines become exact linear cubic segments;
- cubics retain their two off-curve controls;
- quadratic segments are converted exactly to equivalent cubic controls.

The adapter converts img2bez's y-up font coordinates into the app's y-down 500-unit glyph view. The returned advance width is retained per glyph and exported with the project.

## Limits

- The current input flow handles one glyph crop at a time; it does not segment a full font specimen automatically.
- The source profile is selectable (`wild`, `clean`, `photo`); the drawing style currently remains `basic`. Unusual scripts and design-specific styles may need further tuning.
- The site head is an optional learned structural classifier, not a generative glyph model.
- DeepVecFont/v2 remains a candidate for multi-reference font completion and style transfer; it is not required for single-glyph tracing.
- Cross-glyph stem-width, baseline, x-height, sidebearing and kerning consistency are not yet solved globally.
- Browser font preview is not a substitute for OpenType Sanitizer, fontbakery or external desktop validation.

## Font output

Cubic geometry is compiled to CFF Type 2 charstrings. The output is OTF, not TTF. Browser FontFace preview verifies that the generated font loads in the page.
