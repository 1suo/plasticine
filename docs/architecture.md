# Plasticine architecture

The editor retains raw pointer contours separately from fitted geometry. Its deterministic baseline uses Ramer–Douglas–Peucker simplification followed by Catmull–Rom-to-cubic fitting. Canonical Glyph IR stores Unicode identity, advance width, contour topology and cubic Bézier segments.

The font backend converts cubic outlines to TrueType-compatible quadratic outlines using opentype.js. The browser loads the resulting TTF through FontFace for the specimen preview. SVG is a rendering/interchange format, not the canonical model.

## Deliberate boundaries

- This initial version is a deterministic geometric baseline, not a trained Vitruvion, Im2Vec, DeepSVG or DiffVG model.
- Tolerance currently controls polyline simplification; curve tension controls cubic handles. It is not yet a differentiable raster loss or discrete topology optimizer.
- Closed silhouette contours are supported. Counters should be drawn in reverse direction; winding needs independent validation.
- The first compiler emits TTF only. CFF/PostScript and WOFF2 are separate future backends.
- Per-glyph metrics, kerning, anchors, font validation and editable handle manipulation remain follow-on work.
