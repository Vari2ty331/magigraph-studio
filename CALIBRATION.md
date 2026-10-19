# Screenshot calibration — 2026-10-16

The user's original 1920 × 1080 screenshots were read directly using Pillow. No game interaction is involved. UI scale and in-game numeric size values are unnecessary: all measurements are ratios in the same image.

## Measurements

- Drawing circle: approximately 400 pixels across the inside of the decorative border. Its exact usable boundary is visually ambiguous by a few pixels.
- `mabinogi_2026_10_16_152635.png`: horizontal stroke at x=850 is solid RGB (0,44,255) from y=494 through y=498 inclusive: **5 pixels**. Adjacent rows are parchment. The translated line in `152652.png` also occupies 5 rows, y=401–405.
- `152804.png`: square centerlines approximately x=806.5 and x=1019.5, y=417.5 and y=630.5: side **213 pixels**. At x=900 the upper edge has two solid-blue rows, y=417–418, with partially blue shoulders and a softer surrounding edge.
- `152937.png`: square centerlines approximately x=878 and x=950, y=488 and y=560.5: side **72–72.5 pixels**. Its narrow stroke is strongly affected by subpixel sampling.

To approximate apparent width without counting every faint edge pixel, estimate coverage from the red channel relative to nearby parchment and interpolate the half-maximum crossings. The large square gives about **4 pixels**, the small square about **1.5 pixels**. Their width/side ratios are approximately 1.9% and 2.1%, supporting a rounded **2%** preset. This is a visual approximation, not a claim about the game's internal stroke geometry. The simulator renders a crisp stroke and does not reproduce the full soft-edge profile.

## Defaults

- Straight line: 100 × 5 / 400 = **1.25 units**, independent of line length.
- Curves: **1.25 units**, using the user's stated equal fixed-width rule; these new screenshots do not independently measure curves.
- Basic outlines: **0.02 × shape size**. This predicts 4.26 pixels on the large square and 1.44 pixels on the small square at screenshot scale. Applying the same ratio to triangles and circles retains the existing simulator model; those shapes were not independently calibrated by this set.

The SVG uses a fixed coordinate system with uniform scaling. Resizing the canvas scales the disc and visible strokes together, preserving these proportions. A 100-unit diameter is a simulator coordinate convention, not a numeric input available in the game.

Previously saved designs with customized calibration remain unchanged. The old default pair is migrated only when the new widths pass boundary validation; migration can be undone. The preset button can apply the measured calibration to any loaded design and is also undoable.
