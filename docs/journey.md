# User journey

| Stage | User action | System response |
|---|---|---|
| 1. Choose glyph | Select a character | Opens its existing vector result |
| 2. Supply source | Upload an image | Displays it in the crop stage |
| 3. Isolate glyph | Drag a crop rectangle | Defines the glyph source region |
| 4. Reconstruct | Adjust threshold and press Reconstruct | Extracts pixel boundaries and closed contours |
| 5. Refine | Adjust simplicity and curve tension | Re-fits cubic Bézier outlines |
| 6. Build typeface | Repeat for characters and compile | Emits CFF/PostScript OTF |
| 7. Verify | Enter specimen text | Renders using the generated OTF via FontFace |
| 8. Preserve | Save project | Exports editable vector contours as JSON |

## Implemented

- Image upload and crop selection.
- Local 256×256 thresholding and automatic pixel-boundary contour tracing.
- Counter contours with opposite winding.
- Cubic fitting, glyph inventory, JSON project export/import.
- CFF OTF compilation and browser FontFace specimen.

## Outstanding

- Crop zoom/pan and rotation.
- Adaptive thresholding, denoising and connected-component selection.
- Better handling of diagonal contacts and low-resolution/noisy glyphs.
- Automatic glyph segmentation from a full page or font specimen.
- Font metrics, side bearings, kerning and cross-glyph consistency.
- OpenType Sanitizer/fontbakery validation and external desktop application checks.
- Playwright end-to-end proof.
