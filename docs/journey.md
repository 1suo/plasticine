# End-to-end user journey (CJM)

The intended outcome is not an SVG. It is a font that survives compilation, installation and use in ordinary software.

| Stage | User action / question | System responsibility | Deliverable / proof |
|---|---|---|---|
| 1. Typeface setup | Name the family and choose the character set | Store family metadata, glyph inventory and design-space metrics | Editable font project |
| 2. Draw / reference | Draw closed contours and optionally import a glyph bitmap | Preserve source contours; decode the bitmap locally into a binary reference mask | Raw contours + optional per-glyph raster mask |
| 3. Reconstruct | Watch a compact outline appear | Fit cubic curves; optionally choose simplification candidates against whole-glyph pixel disagreement | Canonical Glyph IR |
| 4. Inspect and correct | Fix handles, joins, counters and proportions | Expose contour graph, Bézier controls, tangent constraints and metric controls | Reviewed glyph outlines |
| 5. Harmonize | Compare related glyphs and spacing | Enforce consistent stem/height/overshoot conventions; set advances and bearings | Coherent glyph set |
| 6. Compile | Build the typeface | Validate glyph mapping, contour winding, metrics and OpenType tables; emit OTF/TTF/WOFF2 | Installable font binaries |
| 7. Preview | Type real text and inspect specimens | Load the compiled binary, not the editor paths; test combinations and fallback behavior | Browser-rendered specimen |
| 8. Install / use IRL | Install the downloaded font in the OS or design tools | Provide OS-specific instructions and a test specimen | Font visible in ordinary apps |
| 9. Iterate / deliver | Reopen project, revise and export | Preserve source strokes, IR and build settings; support repeatable compilation | Portable editable project + final font |

## Current vertical slice

Implemented now:
- Character inventory for Latin uppercase/lowercase and digits.
- Multi-contour pointer drawing and per-glyph source preservation.
- Deterministic simplification and cubic fitting.
- Optional per-glyph raster reference import, binary mask comparison and coordinate-descent selection of simplification candidates.
- Canonical IR and JSON project import/export.
- CFF/PostScript OTF compilation.
- FontFace live specimen preview and automatic OTF download.
- CI checks for typecheck, geometry/raster tests, CFF parseability and production build.

Still outstanding:
- Automatic contour extraction from raster images; the reference currently guides fitting of contours the user has drawn.
- Differentiable/antialiased raster optimization, affine alignment and subpixel refinement.
- Robust hole/winding/topology inference and discrete split/merge search.
- Editable Bézier handles, constraints, anchors, bearings and per-glyph advances.
- Cross-glyph consistency/spacing and kerning.
- Automated OTS/fontbakery validation and Playwright end-to-end browser test.
- OS installation integration or proof in external desktop apps.
- WOFF2 and TTF backends.

## Manual real-world check

1. Draw at least A, O, S, R, a, g, i, m and 8. Draw counters in the opposite direction.
2. Optionally import a black-on-white reference image for a glyph and inspect its raster mismatch score.
3. Compile and save the downloaded `.otf`.
4. Install the OTF using the operating system's font installer (Linux desktop: open the file in the font viewer or copy it into `~/.local/share/fonts/`, then run `fc-cache -f`; macOS: open in Font Book; Windows: right-click and choose Install).
5. Restart the target application if it caches its font list.
6. Test a specimen containing round, diagonal, narrow, wide and counter-bearing glyphs; compare it with the browser specimen.
7. Reopen the exported Plasticine JSON project and verify that the original contours remain editable.
