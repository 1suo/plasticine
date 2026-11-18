# Acceptance

## Drawing canvas
- [x] Draw directly on a white glyph canvas.
- [x] Black and white pen colors.
- [x] Adjustable round brush size.
- [x] White eraser.
- [x] Add, select, hide and delete drawing layers.
- [x] Optional imported image beneath drawing layers.
- [x] Crop mode and draw mode.
- [x] Persist drawing layers in project JSON.
- [ ] Undo/redo, layer reordering, zoom/pan and source-image persistence.

## Raster-to-vector
- [x] Composite visible source image and visible drawing layers.
- [x] Use white background and monochrome authoring.
- [x] Pass the composite PNG to img2bez WASM.
- [x] Learned site classification, structural feature detection, constrained Bézier fitting and raster refinement.
- [ ] Validate against a labeled real-world glyph corpus.
- [ ] Browser E2E test of drawing → reconstruction.

## Font
- [x] Preserve UFO line/cubic/quadratic semantics.
- [x] Preserve per-glyph advance widths.
- [x] Compile CFF/PostScript OTF.
- [x] Load generated OTF in browser specimen.
- [ ] OpenType Sanitizer/fontbakery and external desktop validation.
- [ ] Cross-glyph metrics, bearings and kerning.

## Product
- [x] Findspot palette set.
- [x] Import/export editable project JSON.
