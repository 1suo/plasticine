# Architecture

Plasticine is a local-first glyph-to-font laboratory. Raw pointer contours are retained independently from fitted geometry, so inference can be rerun without losing the user's drawing.

## Pipeline

1. Pointer input records closed glyph contours in a 500×500 coordinate space.
2. Candidate simplification applies Ramer–Douglas–Peucker at several tolerances.
3. Each candidate is fitted to cubic Bézier segments using Catmull–Rom-derived handles.
4. The default fitting objective uses symmetric sampled point-set distance plus a segment-count penalty:
   `geometricObjective = sampledContourDistance + λ × segmentCount × 8`.
5. An optional reference image is decoded locally, stretched to the 500×500 glyph space, and thresholded at luminance 180 into a 128×128 binary ink mask. A scanline point-in-path rasterizer renders the candidate cubic contours with non-zero winding semantics. Coordinate descent chooses among per-contour simplification candidates against the whole-glyph objective:
   `rasterObjective = differingPixels / totalPixels + λ × segmentCount × 0.0005`.
6. Canonical Glyph IR stores Unicode identity, advance width, contour topology and cubic Bézier geometry.
7. opentype.js emits an OpenType CFF font. CFF Type 2 charstrings retain cubic outlines; this is an OTF, not a TTF.
8. The browser loads the generated OTF using FontFace, renders the live specimen and downloads the font.

## Raster fitting: exact scope

This is raster-guided fitting of user-provided contours, not automatic image tracing. The user still draws the initial contour topology. The reference image guides the choice of simplification candidates; the optimizer does not move Bézier control points continuously, infer missing contours, or propose holes/components. The binary objective has no antialiasing, multiscale term, affine registration or subpixel refinement. It is a deterministic baseline, not DiffVG.

Reference images remain in browser memory and are not embedded in project JSON. Per-glyph references are used when compiling; only the active glyph's reference is shown in the editor.

## Representation

SVG is a view/interchange representation, not the canonical data model. Cubic geometry stays first-class in IR and is not converted to quadratics for the current CFF output. The compiler owns output-format concerns.

## Current limitations

- The reconstruction backend is deterministic geometry, not a trained Vitruvion, Im2Vec, DeepSVG or DeepVecFont model.
- Discrete topology optimization (split/merge contours, junction hypotheses, hole classification) is not implemented.
- Drawn contours are closed silhouettes. Counter winding must be checked; robust topology validation is pending.
- Glyph advance width is currently a shared default. Per-glyph bearings, metrics, anchors, kerning and variable-font axes are not yet implemented.
- The live preview uses FontFace in the browser. Automated CI verifies geometry, raster fitting, CFF output parsing, typecheck and production build; it does not automate OS-level installation or external application specimens.
- WOFF2 export, font QA/repair, editable Bézier handles and learned inference backends remain future work.
