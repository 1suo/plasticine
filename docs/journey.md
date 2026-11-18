# User journey

| Stage | User action | System response |
|---|---|---|
| 1. Choose glyph | Select a character | Opens its existing vector result |
| 2. Supply source | Upload an image | Displays it in the crop stage |
| 3. Isolate glyph | Drag a crop rectangle | Defines the source region |
| 4. Reconstruct | Choose source profile, adjust threshold and press Reconstruct | Runs img2bez WASM with learned site classification and raster refinement |
| 5. Refine | Adjust curve tension | Adjusts inferred cubic handles |
| 6. Build typeface | Repeat for characters and compile | Emits CFF/PostScript OTF |
| 7. Verify | Enter specimen text | Renders using the generated OTF via FontFace |
| 8. Preserve | Save project | Exports editable vector contours and advance widths as JSON |

## Implemented

- Image upload and crop selection.
- 1024×1024 grayscale crop passed to img2bez WASM.
- Subpixel contour extraction, structural feature placement, line/cubic fitting, raster refinement, H/V constraints and grid snapping through img2bez.
- Learned img2bez site-classification head enabled locally in WASM.
- UFO point-stream adapter preserving line/cubic/quadratic semantics and advance width.
- Findspot palettes, glyph inventory, JSON project import/export.
- CFF OTF compilation and browser FontFace specimen.

## Outstanding

- Crop zoom/pan and rotation.
- Drawing-style selector (basic/grotesk/old-style/geometric/brush/nib/qalam).
- Full specimen segmentation and batch tracing.
- Cross-glyph baseline, cap/x-height, stem-width, sidebearing and spacing consistency.
- OpenType Sanitizer/fontbakery validation and external desktop application checks.
- Browser end-to-end proof of upload → crop → WASM trace → compile → preview → download.
