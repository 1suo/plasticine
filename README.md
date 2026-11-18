# Plasticine

Image-first glyph reconstruction and CFF font compilation in the browser.

## Workflow

1. Open a raster image containing a glyph.
2. Drag a crop around the glyph in the image stage.
3. Adjust the foreground threshold and reconstruct. Pixel boundaries become closed vector contours; counters are retained as oppositely wound contours.
4. Adjust curve simplicity and tension.
5. Repeat for the required characters, compile a CFF/PostScript OTF, and test it in the specimen.
6. Save the editable project as JSON.

Images are processed locally in the browser. No drawing by hand is required.

## Controls

- Open image — PNG, JPEG, WebP, BMP and browser-decodable image formats.
- Crop — drag a rectangular selection over the displayed image.
- Threshold — choose which pixels count as ink (dark-on-light source).
- Reconstruct — trace the binary pixel boundary graph into vector contours.
- Simplicity / curve tension — fit the traced boundaries to cubic Bézier segments.
- Findspot palette — switch among the six palettes defined in 1suo/findspot.

## Implementation

The tracer extracts exposed pixel edges and follows closed loops. Non-zero winding preserves holes when contours have opposite orientation. The vector fitter then simplifies each loop and converts it to cubic Bézier geometry. This is direct binary boundary tracing, not a learned image-to-vector model and not DiffVG.

The editor retains source contours in the project JSON. The source raster itself is not embedded. The compiler emits CFF/PostScript OTF with cubic outlines.

## Development

    npm install
    npm run dev
    npm test
    npm run typecheck
    npm run build

See docs/architecture.md, docs/research.md, docs/journey.md and docs/acceptance.md.
