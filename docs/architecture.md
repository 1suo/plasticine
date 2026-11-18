# Architecture

Plasticine is an image-first glyph reconstruction and font compilation tool. The uploaded raster is evidence for a geometric model; traced pixel edges are not intended to become the final outline.

## Pipeline

1. Upload and crop a glyph raster.
2. Rasterize the crop to a normalized 256×256 dark-ink mask.
3. Extract connected boundary loops and preserve counter winding.
4. Resample and smooth the observed boundary to suppress pixel-grid noise.
5. Detect corner candidates from scale-aware changes in boundary tangent.
6. Partition each loop into spans and classify each span as a line or a curve using total-least-squares line fitting and maximum orthogonal residual.
7. Snap near-horizontal and near-vertical line spans to shared orthogonal coordinates; preserve shared endpoints at corners.
8. Fit non-linear spans with least-squares cubic Bézier controls.
9. Store line/curve primitive intent in the glyph geometry and compile cubic outlines to CFF/PostScript OTF.

## Geometric inference

The current deterministic CV stage includes:
- boundary resampling and local smoothing;
- tangent-based corner detection with non-maximum suppression;
- PCA/total-least-squares line fitting;
- line-versus-curve classification by residual;
- horizontal/vertical orientation recognition, orthogonal snapping and cross-contour grid-coordinate clustering;
- cubic Bézier least-squares fitting for curved spans;
- preservation of contour winding and counters.

The pixel tracer is now an observation extractor. Final output consists of a small set of geometric primitives, not one segment per pixel edge.

## Model boundary and remaining work

No pretrained neural model is currently shipped or executed by the browser app. This is deliberate rather than implied integration:
- DeepVecFont/v2 is a font-completion/synthesis model conditioned on reference glyphs in raster and vector modalities; it is a candidate for cross-glyph style inference and completion, not a drop-in single-glyph tracer.
- Deep Vectorization of Technical Drawings has the most transferable pipeline structure (cleanup, primitive proposals, geometric refinement), but its released model is trained for technical line drawings and requires a font-specific adaptation and runtime.
- Vitruvion predicts parametric sketch primitives and constraints from CAD sketch data, with image conditioning; it is not a trained typography model.
- Im2Vec supplies a differentiable raster-supervised vector-generation approach, but requires model training/inference and does not guarantee typographic topology.
- DiffVG-style raster loss, global topology proposals, shared stroke-width inference, baseline/cap/x-height detection, symmetry, overshoot and cross-glyph constraints are not yet implemented.

The current CV implementation is a geometric baseline and must be validated on a glyph corpus before claiming production-quality reconstruction. In particular, diagonal contacts, noisy scans, very small counters, complex junctions and heavily stylized letterforms need dedicated handling.

## Font output

Cubic geometry is compiled to CFF Type 2 charstrings. The output is OTF, not TTF. Browser FontFace preview is not a substitute for external font QA or installation tests.
