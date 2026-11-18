# Research assessment

## Selected reconstruction engine: img2bez

[img2bez](https://github.com/fontgarden/img2bez) is the closest match to Plasticine's actual task: raster glyphs to font-ready Bézier outlines. It is not a generic logo tracer. Its structural output targets type-design conventions: extrema, corners, inflections, horizontal/vertical handles, smooth joins, minimal point counts, winding and grid alignment.

Its four-stage pipeline is:
1. Subpixel boundary extraction from grayscale antialiasing.
2. Structural feature placement (corners, extrema, tangent points and inflections).
3. Constrained cubic fitting with candidate scoring against source pixels.
4. Font cleanup: winding, grid snapping, H/V handle correction, G2 harmonization and corner reconstruction.

It also has optional tiny learned decision heads. Plasticine enables the learned site head in browser WASM; it does not use a large generative model or a remote inference service. The upstream project reports 0.964 mean structural score on its basic-Latin reference-font evaluation (62 glyphs); that is the upstream benchmark, not an independently reproduced Plasticine score. [Repository and technical details](https://github.com/fontgarden/img2bez) · [Design rationale and demo](https://elih.net/blog/img2bez/).

## Other supplied research and its role

- **DeepVecFont / DeepVecFont-v2** (SIGGRAPH Asia 2021 / CVPR 2023) are font-specific dual-modality synthesis systems. They consume reference glyphs in raster and vector forms to synthesize or complete a font. They are candidates for future multi-glyph style transfer and completion, not single-raster-glyph tracing. [v1](https://github.com/yizhiwang96/deepvecfont) · [v2](https://github.com/yizhiwang96/deepvecfont-v2)
- **Deep Vectorization of Technical Drawings** (Egiazarian et al., ECCV 2020) separates image cleaning, neural primitive proposals and geometric refinement. Its learned primitive proposals target technical drawings; img2bez is a much closer font-domain solution.
- **Vitruvion** (Seff et al., ICLR 2022) generates CAD sketch primitives and relational constraints. Its constraint-graph ideas are relevant to future cross-glyph design constraints, but it is not a typography model.
- **Im2Vec** (Reddy, CVPR 2021 workshop) learns vector graphics from raster supervision through differentiable rendering. It is useful research on topology and raster losses, but does not enforce type-design structure.
- **Fidelity vs. Simplicity** (Favreau, Lafarge and Bousseau, ACM TOG 2016) optimizes compact curve networks with fidelity and simplicity objectives and reasons about junction topology.
- **DiffVG** (Li et al., ACM TOG / SIGGRAPH Asia 2020) differentiates vector rasterization so vector parameters can be optimized against raster losses. img2bez has its own raster refinement stage, avoiding the need to integrate DiffVG as the first implementation step.
- **DeepSVG** is a hierarchical vector-graphics model, not a font-specific architecture.

## Plasticine integration

- Upstream source is pinned to `fontgarden/img2bez@278aa3683f1e7243158c82b1bdcdafec6436cfc6`.
- Its upstream WASM wrapper is embedded in this repository with the upstream SPDX attribution.
- `siteHead` is enabled; `cornerHead` is disabled.
- The WASM package is built automatically before Vite dev/build via `scripts/build-wasm.mjs`.
- The adapter preserves UFO point semantics and translates line, cubic and quadratic segments into the app's cubic Glyph IR.

## Remaining work

1. Validate real-world scans and generated glyphs against a labeled corpus, not only synthetic adapter tests.
2. Add drawing-style selection (grotesk/old-style/geometric/brush/nib/qalam) where it materially improves the output.
3. Establish cross-glyph metrics and constraints: cap height, x-height, baseline, overshoot, shared stem widths, sidebearings and spacing.
4. Add full-specimen segmentation and batch tracing.
5. Validate exported OTF with OpenType Sanitizer/fontbakery and external font editors.

## Bibliography corrections

- Vitruvion is Seff et al., ICLR 2022, not CVPR 2022.
- PolyFit (Dominici et al., 2020) is distinct from Fidelity vs. Simplicity (Favreau et al., 2016).
- DiffVG does not solve discrete topology changes by itself.
