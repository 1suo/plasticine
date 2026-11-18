# Architecture

Plasticine combines a layered black-and-white glyph canvas with font-oriented raster-to-vector reconstruction and CFF font compilation.

## Authoring canvas

- White 500×500 drawing surface.
- Black/white round pen, adjustable brush size, and white-stroke eraser.
- Multiple named drawing layers; each can be selected, hidden or deleted.
- Optional imported raster image beneath the drawing layers.
- Crop mode selects the source region; draw mode edits the composite.
- Project JSON persists per-glyph strokes, layer visibility, vector contours and advance widths.

## CV input

Reconstruction renders a fresh 1024×1024 white-backed composite:
1. Draw the selected crop from the imported image, if present and visible.
2. Map visible drawing-layer strokes into the same crop, preserving stroke width and round caps.
3. Clip to the crop and leave hidden layers out.
4. Pass the resulting PNG bytes and selected threshold/profile to img2bez WASM.

This is deliberate: CV sees what the user sees in the composite, not just the original uploaded image. With no imported image, the full drawing canvas is the CV source. Black and white are the only authoring colors for now.

## Vector reconstruction

The pinned `fontgarden/img2bez` engine extracts subpixel boundaries, places structural features (corners, extrema, tangents and inflections), fits line/cubic geometry, applies H/V handle constraints and grid snapping, refines against raster pixels and corrects contour winding. The learned site head is enabled.

Plasticine converts the engine's UFO point stream to its cubic Glyph IR and retains the returned advance width. Existing fitted handles are preserved at neutral curve tension.

## Font output

Cubic contours compile to CFF Type 2 charstrings in an OTF. Browser FontFace preview confirms that the generated font loads; external OpenType validation is still outstanding.

## Limits

- The source image itself is not embedded in project JSON; drawing layers and vector geometry are.
- Layer blending is intentionally simple opaque black/white paint, not alpha compositing.
- There is no layer reordering, undo/redo, pressure sensitivity or zoom/pan yet.
- One crop is reconstructed at a time; automatic specimen segmentation and cross-glyph metric consistency remain future work.
