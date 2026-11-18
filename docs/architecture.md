# Architecture

Plasticine is a browser glyph authoring and font-compilation application. The drawing surface and the CV reconstruction system are separate concerns.

## Authoring canvas

- White 500×500 drawing surface.
- Black/white round pen, adjustable brush size, and white-stroke eraser.
- Multiple drawing layers; each can be selected, hidden or deleted.
- Optional imported raster image beneath drawing layers.
- Crop mode and draw mode.
- Project JSON persists per-glyph strokes, layer visibility, vector contours and advance widths.

## CV input contract

The CV system receives the flattened 1024×1024 black-and-white composite of the visible source image and visible drawing layers. Hidden layers are excluded. With no imported image, the full drawing canvas is the input. This input contract must remain stable when the recognition engine changes.

## Current implementation status

The current `img2bez` WASM integration is retained only as a legacy raster-to-outline baseline. It extracts contours and fits outline segments, but does not provide the requested recognition of drawing intent and geometric relationships. It is not the target architecture and must not be represented as such.

## Intended structural reconstruction

See [CV model evaluation](cv-model-evaluation.md). The research points toward a staged system:

1. Recover stroke topology and candidate geometric primitives from the raster.
2. Infer relationships and constraints between primitives.
3. Resolve ambiguous junctions and simplify the resulting curve network globally.
4. Convert the accepted geometry into editable font outlines.
5. Apply font-specific consistency and metrics across glyphs.

The output must retain explicit structure: primitive type, endpoints, control points, junction identity, constraint type, confidence and provenance. Raster similarity alone is not an acceptance criterion.

## Deployment constraint

The app is currently a Vite/React client application. The strongest candidate research implementations are PyTorch projects with Python, native dependencies, model weights and (for practical inference) GPU-oriented environments. They cannot be assumed to run in the browser or be bundled into the existing WASM module. The inference runtime and deployment target must be chosen based on measured model execution, memory and latency; no fake client-side adapter should stand in for missing inference.

## Font output

The current compiler converts cubic contours to CFF/PostScript outlines in an OTF. Browser FontFace preview is available. External OpenType validation and cross-glyph metrics remain separate acceptance items.
