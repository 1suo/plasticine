# Architecture

Plasticine is an image-first glyph-to-font tool. The source of truth for reconstruction is the uploaded raster crop; the user does not draw contours manually.

## Pipeline

1. The user uploads a browser-decodable raster image.
2. A crop rectangle selects one glyph. The selected source rectangle is sampled into a 256×256 canvas.
3. The threshold control converts dark pixels to a binary foreground mask.
4. The pixel tracer emits directed exposed pixel edges. Edges are stitched into closed loops. Outer contours and counters naturally have opposite winding.
5. Each loop is mapped into 500×500 glyph coordinates, simplified with Ramer–Douglas–Peucker, and fitted with cubic Bézier segments.
6. The canonical Glyph IR stores Unicode identity, advance width, contours and cubic geometry.
7. opentype.js compiles the glyphs into a CFF/PostScript OTF.
8. The browser loads the generated OTF through FontFace for specimen preview and downloads it.

## Raster tracing

This is actual raster-to-contour reconstruction: the source crop is thresholded and its pixel boundaries are traced automatically. It is deterministic and does not require the user to draw initial paths.

Current constraints:
- Input is a single glyph crop, dark ink on a light background.
- Thresholding is global, not adaptive.
- Pixel boundaries are exact at the sampled 256×256 resolution; there is no antialiasing-aware or subpixel optimization.
- Diagonally touching components and noisy scans can create ambiguous boundary junctions.
- No learned denoising, component classification, affine deskewing, baseline detection or automatic glyph segmentation is included.
- Curve fitting simplifies traced boundaries; it does not yet optimize Bézier control points against a differentiable raster loss.

## Findspot palettes

The UI palette definitions are copied from the source TOML files in 1suo/findspot/palettes/: Alexandria, Babylon, Knossos, Petra, Tikal and Troy. Findspot is the palette source of truth.

## Font output

Cubic geometry stays first-class in IR and is compiled to CFF Type 2 charstrings. The output is OTF, not TTF. Browser preview verifies the generated font through FontFace; external font QA and OS installation tests remain separate acceptance steps.
