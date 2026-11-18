# Research assessment and implementation plan

## Relevant methods and what they actually do

- **DeepVecFont** (Wang & Lian, SIGGRAPH Asia 2021) and **DeepVecFont-v2** (CVPR 2023) are font-specific dual-modality synthesis systems. They consume reference glyphs in raster and vector forms to synthesize or complete a font. They are the strongest candidates for cross-glyph style transfer and font completion, but are not standalone single-raster-glyph vectorizers. [v1 code](https://github.com/yizhiwang96/deepvecfont) · [v2 code](https://github.com/yizhiwang96/deepvecfont-v2)
- **Deep Vectorization of Technical Drawings** (Egiazarian et al., ECCV 2020) uses image cleaning, transformer-based primitive proposals and geometric refinement. Its decomposition is highly relevant, but the training distribution and primitive targets are technical drawings rather than typography. [Paper and code](https://artonson.github.io/publications/2020-deep-vectorization/)
- **Vitruvion** (Seff et al., ICLR 2022) generates CAD sketch primitives and relational constraints, and can condition on hand-drawn sketch images. It offers a constraint-graph paradigm (parallel, perpendicular, coincidence, tangency), not a ready-made font reconstruction model. [Project](https://lips.cs.princeton.edu/vitruvion/)
- **Im2Vec** (Reddy, CVPR 2021 workshop) learns vector graphics from raster supervision through differentiable rendering. It is useful for topology-aware raster-to-vector learning, but does not enforce typographic design intent by itself. [Paper](https://openaccess.thecvf.com/content/CVPR2021W/SketchDL/html/Reddy_Im2Vec_Synthesizing_Vector_Graphics_Without_Vector_Supervision_CVPRW_2021_paper.html)
- **Fidelity vs. Simplicity** (Favreau, Lafarge and Bousseau, ACM TOG 2016) optimizes compact curve networks with fidelity and simplicity objectives and reasons about junction topology. [Paper summary](https://emyu.gitlabpages.inria.fr/blog/2020/03/25/fidelity-vs-simplicity/)
- **DiffVG** (Li et al., ACM TOG / SIGGRAPH Asia 2020) differentiates vector rasterization so vector parameters can be optimized against raster losses. Discrete topology changes still require a separate proposal/search mechanism. [Paper](https://people.csail.mit.edu/tzumao/diffvg/diffvg.pdf)
- **DeepSVG** is a hierarchical vector-graphics model, not a font-specific architecture. [Paper](https://arxiv.org/abs/2007.11301)

## Current implementation

The browser app now has a deterministic geometric CV stage: boundary conditioning, tangent-based corner detection, line/curve classification, total-least-squares line fitting, orthogonal snapping, cross-contour grid alignment, and least-squares cubic fitting. It retains explicit contour topology and compiles the inferred geometry to CFF OTF.

**No pretrained network from the papers above is integrated yet.** In particular, the current stage is not DeepVecFont, Im2Vec, the technical-drawing transformer, or DiffVG. Those require their own runtime, weights, training-data compatibility and inference adapters. The app must not claim otherwise.

## Next engineering stages

1. Build a labeled glyph benchmark with raster inputs and reference outlines; report contour topology, IoU, boundary distance, primitive count and font-rendering quality.
2. Add robust preprocessing: adaptive thresholding, deskew, background removal, component analysis and subpixel boundary estimation.
3. Improve geometric constraints: shared stem widths, repeated parallel edges, symmetry, baselines, cap/x-height, overshoot and junction constraints.
4. Add global discrete split/merge/topology proposals and a raster-rendering objective for continuous curve refinement.
5. Evaluate DeepVecFont-v2 as a multi-reference glyph completion/style-consistency backend, not as the single-glyph tracer.
6. Evaluate the technical-drawing vectorizer's primitive proposal network only after adapting its training data and primitive vocabulary to filled glyph outlines.

## Bibliography corrections

- Vitruvion is Seff et al., ICLR 2022, not CVPR 2022.
- PolyFit (Dominici et al., 2020) is distinct from Fidelity vs. Simplicity (Favreau et al., 2016).
- DiffVG is a differentiable vector rasterizer; it does not solve discrete topology changes by itself.
