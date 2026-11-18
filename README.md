# Plasticine

Image-first glyph reconstruction and CFF font compilation in the browser.

## Workflow

1. Open a raster image containing a glyph.
2. Crop around the glyph.
3. Adjust the dark-foreground threshold and reconstruct.
4. Inspect the inferred vector outline, then repeat for other characters.
5. Compile a CFF/PostScript OTF and test it in the specimen.
6. Save the editable project as JSON.

Images are processed locally in the browser.

## Reconstruction

The reconstruction pipeline uses raster boundaries as observations, then performs geometric inference:
- resampling and smoothing to suppress pixel-grid noise;
- tangent-based corner detection;
- line/curve classification using total-least-squares fitting;
- horizontal/vertical recognition and orthogonal snapping;
- least-squares cubic Bézier fitting for curved spans;
- shared corner coordinates and preserved counter winding.

This is a deterministic CV baseline, not a pretrained neural model. The pixel boundary graph is an intermediate representation, not the final vector geometry. See [architecture](docs/architecture.md) and [research](docs/research.md) for the model distinctions and remaining work.

## Controls

- Open image — load a browser-decodable raster.
- Crop — select one glyph in the image stage.
- Threshold — choose dark foreground pixels.
- Reconstruct — infer line and cubic-curve primitives.
- Findspot palette — switch among the six palettes from 1suo/findspot.
- Project — import/export glyph geometry.
- Compile OTF — generate and preview the font.

## Development

    npm install
    npm run dev
    npm test
    npm run typecheck
    npm run build
