# Architecture

Plasticine is a local-first glyph-to-font laboratory. Raw pointer contours are retained independently from fitted geometry, so inference can be rerun without losing the user's drawing.

## Pipeline

1. Pointer input records closed glyph contours in a 500×500 coordinate space.
2. A candidate search applies Ramer–Douglas–Peucker simplification at several tolerances.
3. Each candidate is fitted to cubic Bézier segments using Catmull–Rom-derived handles.
4. A symmetric sampled point-set distance estimates geometric fidelity. The objective adds an explicit segment-count penalty:

   `objective = fitError + λ × segmentCount × 8`

   The UI exposes λ as the simplicity penalty. This is a geometric proxy, not yet a raster-image loss.
5. Canonical Glyph IR stores Unicode identity, advance width, contour topology and cubic Bézier geometry.
6. opentype.js emits an OpenType CFF font. CFF Type 2 charstrings retain cubic outlines; this is an OTF, not a TTF.
7. The browser loads the generated OTF using FontFace, renders the live specimen and downloads the font.

## Representation

SVG is a view/interchange representation, not the canonical data model. Cubic geometry stays first-class in IR and is not converted to quadratics for the current CFF output. The compiler owns output-format concerns.

## Current limitations

- The reconstruction backend is deterministic geometry, not a trained Vitruvion, Im2Vec, DeepSVG or DeepVecFont model.
- Raster fitting is binary and 128×128; it uses a fixed luminance threshold, stretches the source to a square glyph canvas, and optimizes only among discrete simplification candidates. It is not a differentiable renderer, subpixel antialiasing model, or DiffVG implementation.\n- Reference images are session-local and are not embedded in project JSON. The current UI uses raster fitting for the active glyph; per-glyph references are applied when compiling the font.
- Discrete topology optimization (split/merge contours, junction hypotheses, hole classification) is not implemented.
- Drawn contours are closed silhouettes. Counter winding must be checked; robust topology validation is pending.
- Glyph advance width is currently a shared default. Per-glyph bearings, metrics, anchors, kerning and variable-font axes are not yet implemented.
- The live preview uses FontFace in the browser. Automated CI currently verifies geometry, CFF output parsing, typecheck and production build; it does not yet automate an OS-level install or external application specimen.
- WOFF2 export, font QA/repair, editable Bézier handles, learned inference backends remain future work.
