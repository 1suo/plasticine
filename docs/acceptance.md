# Acceptance

## Drawing canvas
- [x] Draw directly on a white glyph canvas.
- [x] Black and white pen colors.
- [x] Adjustable round brush size.
- [x] White eraser.
- [x] Add, select, hide and delete drawing layers.
- [x] Optional imported image beneath drawing layers.
- [x] Crop mode and draw mode.
- [x] Persist drawing layers in project JSON.
- [ ] Undo/redo, layer reordering, zoom/pan and source-image persistence.

## Structural CV — requested outcome
- [ ] Detect stroke endpoints, corners, junctions and intersections.
- [ ] Distinguish straight segments, circular/elliptical arcs and freeform curves.
- [ ] Infer horizontal/vertical alignment, orthogonality, parallelism and perpendicularity.
- [ ] Infer coincidence, tangency, symmetry and repeated/shared dimensions where supported by evidence.
- [ ] Preserve topology: counters, connected components, crossings and shared junctions.
- [ ] Infer centerlines/contours and stroke width without confusing filled-outline tracing with intended centerline geometry.
- [ ] Return editable primitives and explicit constraints with confidence/provenance.
- [ ] Display inferred geometry and constraints as inspectable, editable overlays.
- [ ] Validate against deliberately imperfect hand-drawn glyph examples with known intended geometry.
- [ ] Demonstrate robust behavior on letters with counters, diagonals, curves, joins and mixed primitive types.

## Legacy bitmap tracing
- [x] Composite visible source image and visible drawing layers.
- [x] Pass composite PNG to img2bez WASM.
- [ ] Do not count this as structural CV acceptance.

## Font
- [x] Compile CFF/PostScript OTF.
- [x] Load generated OTF in browser specimen.
- [ ] OpenType Sanitizer/fontbakery and external desktop validation.
- [ ] Cross-glyph metrics, bearings and kerning.

## Product
- [x] Findspot palette set.
- [x] Import/export editable project JSON.
