# Acceptance

## Raster-to-vector
- [x] Upload a raster glyph image.
- [x] Select a crop rectangle in the image stage.
- [x] Threshold the crop locally into a binary mask.
- [x] Trace pixel boundaries into closed vector contours.
- [x] Preserve counters through opposite contour winding.
- [x] Fit cubic Bézier curves to traced contours.
- [ ] Adaptive thresholding, denoising and crop zoom/rotation.
- [ ] Robust diagonal-contact and noisy-scan handling.

## Font
- [x] Compile cubic contours into CFF/PostScript OTF.
- [x] Load generated OTF into browser specimen through FontFace.
- [ ] OpenType Sanitizer/fontbakery validation.
- [ ] External desktop application and OS installation validation.
- [ ] Per-glyph metrics, bearings and kerning.

## Product
- [x] Minimal image-first workflow; no hand-drawing requirement.
- [x] Findspot palette set sourced from original TOML palettes.
- [x] Import/export editable project JSON.
- [ ] Automated browser test for upload → crop → reconstruct → compile → preview → download.
