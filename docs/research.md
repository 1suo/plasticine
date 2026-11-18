# Research assessment and implementation plan

## Bibliography corrections

- **Vitruvion** is Seff et al., *Vitruvion: A Generative Model of Parametric CAD Sketches*, ICLR 2022 (not CVPR 2022). It models primitives plus relational constraints and can condition on hand-drawn sketch images. The transferable idea is construction intent and a constraint graph, not a ready-to-use font tracer. [Paper](https://lips.cs.princeton.edu/pdfs/seff2022vitruvion.pdf)
- **Deep Vectorization of Technical Drawings** is Egiazarian et al., ECCV 2020. It separates cleanup, primitive prediction and geometric optimization. It targets technical drawings, so its primitive vocabulary and training distribution need adaptation before use on glyphs. [Paper/project](https://artonson.github.io/publications/2020-deep-vectorization/)
- **Im2Vec** is Reddy et al., CVPR 2021. It learns vector output from raster supervision without paired vector targets, using differentiable rendering. This is a strong learning-based baseline, but it does not promise typographically valid contour topology or compact font outlines. [Paper](https://openaccess.thecvf.com/content/CVPR2021/html/Reddy_Im2Vec_Synthesizing_Vector_Graphics_Without_Vector_Supervision_CVPR_2021_paper.html)
- **Fidelity vs. simplicity** is Favreau, Lafarge and Bousseau, ACM TOG 2016, not Dominici et al. 2020. It explicitly optimizes a compact curve network using fidelity and simplicity terms and reasons about junction topology. This is the closest conceptual match to a segment-count penalty. [Paper summary](https://emyu.gitlabpages.inria.fr/blog/2020/03/25/fidelity-vs-simplicity/)
- **PolyFit** is Dominici et al., ACM TOG 2020. It is a distinct method for perception-aligned raster clip-art vectorization through intermediate polygon fitting; it is not the Fidelity vs. Simplicity paper. [Paper](https://www.cs.ubc.ca/~lsigal/Publications/dominici2020siggraph.pdf)
- **DiffVG** is Li et al., ACM TOG / SIGGRAPH Asia 2020. It differentiates vector rasterization and enables image-domain losses and continuous optimization. Its paper explicitly leaves discrete topology changes outside differentiable parameter optimization. [Paper](https://people.csail.mit.edu/tzumao/diffvg/diffvg.pdf)
- **DeepSVG** is a hierarchical vector-graphics model for SVG icons/graphics, not a font-specific architecture. It may be useful as a generic sequence/shape representation baseline. [Paper](https://arxiv.org/abs/2007.11301)
- **DeepVecFont** (Wang & Lian, SIGGRAPH Asia 2021) is genuinely font-specific and uses dual-modality learning to synthesize vector fonts from a small set of reference glyphs. **DeepVecFont-v2** (CVPR 2023) improves sequence handling and outline quality. These are the most relevant learned font-completion baselines. [Code](https://github.com/yizhiwang96/deepvecfont) · [v2 paper](https://openaccess.thecvf.com/content/CVPR2023/html/Wang_DeepVecFont-v2_Exploiting_Transformers_To_Synthesize_Vector_Fonts_With_Higher_Quality_CVPR_2023_paper.html)

## Recommended architecture

Do not combine every paper into one neural pipeline. Use independent stages and interchangeable backends:

1. **Input and normalization:** source strokes or reference raster; baseline/cap/x-height guides; normalize scale and position.
2. **Topology proposal:** contours, holes, junctions, open endpoints and connected components. Keep topology discrete and explicit.
3. **Primitive/curve fitting:** line, arc and cubic candidates; continuity constraints; shared tangent and junction constraints.
4. **Objective:** raster fidelity + curve count + curve degree/control-point cost + topology/continuity penalties. Search split/merge/topology proposals outside the continuous optimizer.
5. **Continuous refinement:** DiffVG-like differentiable rasterization to optimize curve coordinates, tangents and widths against the source image.
6. **Typography constraints:** consistent cap/x-height/baseline, stem weights, overshoots, advance widths, side bearings, anchors and spacing.
7. **Font completion:** optionally evaluate DeepVecFont/v2 to propose missing glyphs or style-consistent alternatives. Human approval remains necessary.

## Current implementation versus target

The app currently has pointer contour input, a deterministic cubic fitter, a sampled geometric point-set fidelity proxy plus an explicit segment-count penalty, canonical glyph IR, and CFF OTF compilation. It does not yet implement source-raster comparison, a DiffVG backend, discrete topology search, typographic constraints, DeepVecFont or automated font QA. The simplicity slider is an actual coefficient in a geometric objective, but it is not the paper's full hypergraph/topology optimization.
