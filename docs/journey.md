# User journey

| Stage | User action | System response |
|---|---|---|
| 1. Choose glyph | Select a character | Opens its drawing layers and vector result |
| 2. Create source | Draw with black/white pen, adjust size, erase, add layers | Maintains an editable monochrome construction |
| 3. Add reference | Optionally upload an image | Displays it below the drawing layers |
| 4. Isolate | Switch to Crop and drag a rectangle | Selects the image/drawing region |
| 5. Reconstruct | Press Reconstruct visible layers | Flattens visible layers to a BW PNG and runs img2bez WASM |
| 6. Inspect | Review contours and segment counts | Shows the font-oriented vector result |
| 7. Build | Repeat for glyphs and compile | Emits CFF/PostScript OTF |
| 8. Preserve | Save project | Exports editable strokes/layers, vectors and advances |

## Implemented

- Direct black/white canvas drawing, adjustable pen size and eraser.
- Add/select/hide/delete drawing layers.
- Optional imported image beneath the drawing layers.
- Crop and composite rendering; CV receives only visible layers plus visible source image.
- img2bez WASM tracing with learned site classification and raster refinement.
- Findspot palettes, glyph inventory, JSON project import/export.
- CFF OTF compilation and browser specimen.

## Outstanding

- Undo/redo, layer reordering, rename, zoom/pan and pressure sensitivity.
- Embed source images in project files.
- Full specimen segmentation and batch tracing.
- Cross-glyph baseline, cap/x-height, stem-width, sidebearing and spacing consistency.
- OpenType Sanitizer/fontbakery validation and external desktop application checks.
- Browser end-to-end proof of draw → composite → CV → compile → preview → download.
