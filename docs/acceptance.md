# Acceptance checklist

## Geometry and editing
- [x] Draw closed contours with pointer input.
- [x] Add multiple contours and preserve drawings when switching glyphs.
- [x] Undo latest contour and clear selected glyph.
- [x] Fit cubic Béziers and optimize sampled geometric fidelity against segment complexity.
- [x] Test closed contours, multiple contours and open/closed fitting.

## Font output
- [x] Compile CFF/PostScript OTF with cubic outlines.
- [x] Parse the generated OTF and verify CFF outline format and cubic path commands.
- [ ] Load generated OTF through FontFace in automated browser test.
- [ ] Validate with OpenType Sanitizer / fontbakery.
- [ ] Verify counters, winding and metrics in external desktop applications.

## User journey
- [x] Export/import source contours as project JSON.
- [x] Download a compiled OTF and load it into the in-app specimen.
- [ ] Reference image import and raster-mask comparison.
- [ ] Editable Bézier handles, anchors, bearings, per-glyph advances and kerning.
- [ ] WOFF2 and TTF export backends.
- [ ] Playwright test covering draw → reconstruct → compile → FontFace render → download.
- [ ] External OS install and desktop application specimen.
