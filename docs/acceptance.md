# Acceptance

## Raster-to-vector
- [x] Upload a raster glyph image.
- [x] Select a crop rectangle in the image stage.
- [x] Preserve grayscale antialiasing through a 1024×1024 crop.
- [x] Run img2bez WASM with learned site classification enabled.
- [x] Extract subpixel boundaries and detect font-oriented structural features.
- [x] Fit compact line/cubic geometry with horizontal/vertical handle constraints.
- [x] Refine geometry against source pixels and preserve counter winding.
- [x] Snap geometry to a design grid.
- [ ] Validate against a labeled real-world glyph corpus.
- [ ] Profile/style controls and automatic full-specimen segmentation.

## Font
- [x] Preserve UFO line/cubic/quadratic semantics in Plasticine's cubic Glyph IR.
- [x] Preserve per-glyph advance widths.
- [x] Compile cubic contours into CFF/PostScript OTF.
- [x] Load generated OTF into browser specimen through FontFace.
- [ ] OpenType Sanitizer/fontbakery validation.
- [ ] External desktop application and OS installation validation.
- [ ] Cross-glyph metrics, bearings and kerning.

## Product
- [x] Minimal image-first workflow; no hand-drawing requirement.
- [x] Findspot palette set sourced from original TOML palettes.
- [x] Import/export editable project JSON.
- [ ] Automated browser test for upload → crop → WASM reconstruct → compile → preview → download.
