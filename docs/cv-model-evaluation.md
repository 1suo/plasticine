# CV model evaluation for Plasticine

This document distinguishes the requested task from ordinary bitmap tracing and records the candidate systems supplied by the user. No candidate is considered integrated until its real inference path is run against Plasticine's glyph examples.

## Task definition

Input is the visible black-and-white drawing composite. Output is not merely a path that follows the pixel boundary. The system must infer the likely intended construction of the glyph:

- stroke endpoints, corners, extrema, tangencies and junctions;
- line, arc and Bézier-like curve primitives;
- geometric relationships such as horizontal, vertical, parallel, perpendicular, coincident and tangent;
- symmetry, alignment, shared baselines and repeated dimensions;
- topology of connected components, crossings and counters;
- editable geometry with confidence and provenance.

A good result should recover a plausible clean construction from imperfect strokes, rather than preserve every wobble in the raster.

## Candidate assessment

| Candidate | What it actually does | Relevance to Plasticine |
|---|---|---|
| [Deep Vectorization of Technical Drawings](https://github.com/Vahe1994/Deep-Vectorization-of-Technical-Drawings) | Learned cleaning, transformer-based primitive estimation, then primitive refinement and merging for technical line drawings. The released pipeline has separate line and curve models. The curve path represents quadratic Bézier primitives; the line path represents line primitives. Its inference code processes 64×64 patches and then runs optimization/merging. | **Strong primitive-inference candidate.** Closest supplied model to recovering intended lines/curves from imperfect raster input. Its training domain is technical drawings, not typography; test transfer to glyphs before adoption. Repository is archived, Python/PyTorch, pretrained weights are separately downloaded, and its code is MPL-2.0. The published inference path has a practical integration defect: its vector-estimation helper calls `.cuda()` unconditionally even though the pipeline accepts a device argument, so CPU inference requires a code patch. It is not a drop-in browser model. |
| [Vitruvion](https://github.com/PrincetonLIPS/vitruvion) | Image-to-primitive transformer plus a separate primitive-to-constraint model, trained on SketchGraphs CAD sketches. Entity classes include arcs, circles, lines and points. The published constraint vocabulary includes coincident, concentric, equal, fixed, horizontal, midpoint, normal, offset, parallel, perpendicular, quadrant, tangent and vertical. | **Strong constraint-inference candidate.** Relevant to design intent and explicit relationships. CAD primitive vocabulary and SketchGraphs distribution do not directly cover typographic Bézier contours; symmetry is not among the listed predicted constraint classes. It requires a glyph-specific adapter/evaluation. Official project provides model weights and code; documented data/render assets are large and inference is Python/PyTorch. |
| [Fidelity vs. Simplicity](https://www-sop.inria.fr/reves/Basilic/2016/FLB16/) | Skeletonizes rough strokes, constructs a graph/hypergraph around endpoints, turns and junctions, then globally optimizes a compact curve network for fidelity and simplicity. | **Strong topology/simplification reference.** Directly addresses ambiguous junctions and spurious fragments. It is an optimization algorithm, not a learned CV model; official page exposes a Windows executable and supplemental data, while source/license portability is uncertain. |
| [DeepVecFont-v2](https://github.com/yizhiwang96/deepvecfont-v2) | Few-shot vector-font synthesis: uses reference glyphs from a font/style to synthesize vector glyphs, with transformer sequence modeling and self-refinement. | **Font prior / optional downstream candidate, not primary sketch recognition.** Can help model typographic shape/style, but its task is synthesis conditioned on reference glyphs, not recovering constraints from one hand-drawn glyph. Official PyTorch implementation and checkpoints are available via external file hosts; CUDA/PyTorch stack. MIT license. |
| [Im2Vec](https://geometry.cs.ucl.ac.uk/projects/2021/im2vec/) | Raster encoder plus latent vector-path decoder, trained through differentiable rasterization without vector supervision. | **Possible raster-to-vector research baseline, not structural constraint inference.** Produces closed paths and varying topology but does not inherently label line/arc primitives or infer CAD-style relations. Official code is PyTorch and requires training/inference assets. |
| [DiffVG](https://people.csail.mit.edu/tzumao/diffvg/) | Differentiable rasterizer enabling gradients from raster-image losses to vector parameters. | **Optimization component, not recognizer.** Useful after a structured initial vector solution exists, for fitting positions/curves to the raster. The paper explicitly leaves discrete topology changes outside its scope. Official code is Apache-2.0 and uses native/CUDA/PyTorch components. |
| [DeepSVG](https://github.com/alexandre01/deepsvg) | Hierarchical model of SVG path/shape sequences for reconstruction, interpolation and generation. | **Vector representation prior, not raster sketch interpretation.** Useful for studying hierarchical shape/path organization or style priors; does not solve primitive/constraint inference from the canvas. Official PyTorch code and pretrained models; MIT license. |

## Architectural conclusion

The supplied research suggests a hybrid, not a single-model substitution:

1. **Primitive proposals:** evaluate Deep Vectorization of Technical Drawings on the glyph raster. Keep separate line and curve hypotheses and expose the model's actual output representation.
2. **Constraint hypotheses:** evaluate Vitruvion's image-to-primitive and primitive-to-constraint stages. Map its primitive/constraint vocabulary into a glyph-oriented representation; do not silently force every glyph into CAD sketch semantics.
3. **Topology and compactness:** use Fidelity vs. Simplicity as the reference for resolving crossings, junctions and over-segmentation. A portable implementation must be independently justified if the original executable cannot be integrated.
4. **Raster fitting:** DiffVG may refine continuous geometry after topology and primitive types are selected. It must not be asked to invent the topology.
5. **Typography prior:** evaluate DeepVecFont-v2 separately for style/shape priors across a font family. It is not a replacement for interpreting the user's drawing.
6. **Representation research:** compare Im2Vec and DeepSVG as vector-shape representations, not as the primary recognition system.

## Integration constraints

Plasticine is currently a static Vite/React client. The strongest supplied candidates are Python/PyTorch systems with external weights, native dependencies and GPU-oriented environments. A browser-only integration is not established by the papers or repositories. A real inference service or a validated model conversion/runtime is required; the deployment choice must follow measured inference latency, memory, model weight size, licensing and operational cost.

Do not silently replace these systems with contour tracing, edge detection, hand-written geometry heuristics or a different library. Any such component must be explicitly identified as preprocessing or postprocessing, with its role and limitations stated.

## Required evaluation before production integration

Build a small labeled glyph benchmark containing rough examples and intended vector constructions. Include:

- axis-aligned stems and bars with imperfect hand strokes;
- deliberately skewed rectangles intended to be orthogonal;
- near-parallel and near-perpendicular strokes;
- shared endpoints and ambiguous crossings;
- open curves and smooth tangencies;
- circles/ovals and curved bowls;
- counters and nested contours;
- symmetric and intentionally asymmetric glyphs;
- mixed line/curve shapes such as A, B, C, G, R, S, 2, 4, 8.

Measure primitive classification, endpoint/corner localization, junction topology, relation precision/recall, raster reconstruction error, editability/primitive count and inference latency. Include ablations so a model is not credited for behavior supplied by postprocessing.

A candidate passes only when it produces inspectable geometry and relationships that correspond to the labeled intent, not merely a visually similar traced silhouette.

## Code-level observations

- Deep Vectorization's public `run_pipeline.py` exposes only `line` and `curve` primitive modes. Its curve merge path converts predictions to quadratic Bézier primitives; its line path emits line primitives. It tiles the image into 64×64 patches and uses separately downloaded checkpoints. `vector_estimation()` invokes `.cuda()` directly instead of using its `device` argument, so the advertised CPU fallback does not work without a patch.
- Vitruvion's `img2cad/graph_data.py` explicitly lists predicted node types `Arc`, `Circle`, `Line`, `Point` and the constraint classes recorded above. The image-to-primitive evaluation path loads the checkpoint onto CUDA and moves the model to CUDA/float16. The separate constraint model is also evaluated with one GPU in the published script.
- These details make both projects useful research starting points, not browser-ready dependencies. Any integration must isolate inference behind a real runtime, normalize coordinates, preserve model confidence and sequence ordering, and map the CAD vocabulary to font-outline semantics without pretending that the vocabularies are identical.
