# Magigraph Simulator — AI drawing protocol (version 1)

You are creating editable geometry for a standalone Mabinogi Magigraph planning simulator. Produce a design JSON, not an image, SVG, executable code, freehand path, or game automation. The user will import the JSON and copy the result into the game manually. Any AI able to output text can use this protocol; browser or tool access is optional. Visual reference reconstruction requires an AI that can inspect the attached image.

## User workflow

1. Give the AI this guide and a reference image or description. State which details matter.
2. Ask it to return one complete JSON object in a single JSON code block, with at most 60 shapes. Save as a .json file, or paste the JSON into 정밀 편집 · JSON and press JSON 적용.
3. Inspect the result in the simulator. If corrections are needed, give the AI the exported JSON, a simulator screenshot, and the requested changes. If import fails, provide the exact validation error too.
4. Use 안내선 and the construction-order slider to copy the design manually into Mabinogi.

The AI does not need a connection to this website or an API key. Nothing is sent to an AI automatically. A link alone only works if the chosen AI can browse it; otherwise paste this guide or attach the downloaded file.

## Hard constraints

- At most 60 shapes in the entire drawing. Every line, basic shape or complete Bézier curve is ONE shape. Do not spend the full budget unless useful; prefer recognizable silhouette and facial features to small details.
- Circular drawing area: center (0,0), radius 50, diameter 100. Positive X is right; positive Y is DOWN. These are simulator units, not in-game numeric inputs.
- All visible ink, including half the stroke width, must remain inside the circle. Keep the design comfortably inside radius 46 to allow corrections.
- Lines and both curve types have fixed stroke width 1.25, independent of length or scale. Basic outline stroke width = size * 0.02. Filled shapes have no separate outline. Do not invent a per-shape width, opacity, color, arbitrary fill or custom path.
- Circles remain circles; squares remain squares; triangles are equilateral. Only uniform scale is supported. No ellipse, rectangle, nonuniform transform, image embedding, compound path or general polygon.
- Curves are OPEN strokes, never filled. Prefer curves for character outlines. You cannot create a filled custom contour by closing a curve. Overlapping allowed strokes can thicken selected marks but each counts toward 60.
- Settings must remain {"stroke":1.25,"outlineRatio":0.02} for normal designs. These are calibrated to the supplied game screenshots; do not change them to fake variable stroke widths.
- Shape order is bottom to top and also the manual construction order. Use unique string IDs. For revisions, preserve IDs and unchanged geometry where practical.

## JSON format

Root object: {"version":1,"settings":{"stroke":1.25,"outlineRatio":0.02},"shapes":[...]}

Every shape requires:
- id: unique nonempty string
- type: one of line, circle, disc, square, filled-square, triangle, filled-triangle, quadratic, cubic
- x, y: center/translation, finite numbers
- size: positive uniform scale, at most 200
- rotation: clockwise degrees, finite number

Type names used in Korean UI:
line = 직선; circle = 빈 원; disc = 꽉 찬 원; square = 빈 네모; filled-square = 꽉 찬 네모; triangle = 빈 세모; filled-triangle = 꽉 찬 세모; quadratic = 곡선; cubic = 2점 곡선.

Local geometry before transformation:
- line: endpoints (-0.5,0), (0.5,0). size is line length; rotation 0 points right.
- circle/disc: radius 0.5. size is diameter.
- square/filled-square: corners (+/-0.5,+/-0.5). size is side length.
- triangle/filled-triangle: vertices (0,-1/sqrt(3)), (0.5,1/(2*sqrt(3))), (-0.5,1/(2*sqrt(3))). size is side length. rotation 0 points up.
- quadratic: points array of EXACTLY 3 {x,y} objects: [P0, control, P2]. B(t)=(1-t)^2 P0+2(1-t)t control+t^2 P2.
- cubic: points array of EXACTLY 4 {x,y} objects: [P0, control1, control2, P3]. B(t)=(1-t)^3 P0+3(1-t)^2 t control1+3(1-t)t^2 control2+t^3 P3.

Transform a local point (u,v): worldX=x+size*(u*cos(a)-v*sin(a)); worldY=y+size*(u*sin(a)+v*cos(a)), where a=rotation*pi/180.

EASIEST CURVE AUTHORING: use x=0,y=0,size=1,rotation=0, and put the desired drawing coordinates directly in points. Avoid accidental double scaling. A cubic can make an S curve; a quadratic has only one shared control point. Control points can be outside the circle if the curve itself stays inside, but keep them inside when possible for simpler validation.

## Minimal complete example (3 shapes)

```json
{"version":1,"settings":{"stroke":1.25,"outlineRatio":0.02},"shapes":[
 {"id":"left-eye","type":"quadratic","x":0,"y":0,"size":1,"rotation":0,"points":[{"x":-18,"y":-8},{"x":-13,"y":-12},{"x":-8,"y":-8}]},
 {"id":"right-eye","type":"quadratic","x":0,"y":0,"size":1,"rotation":0,"points":[{"x":8,"y":-8},{"x":13,"y":-12},{"x":18,"y":-8}]},
 {"id":"smile","type":"cubic","x":0,"y":0,"size":1,"rotation":0,"points":[{"x":-15,"y":8},{"x":-10,"y":24},{"x":10,"y":24},{"x":15,"y":8}]}
]}
```

## Validation and browser-capable agents

Use design.schema.json to check structure. JSON Schema cannot prove geometric containment; the simulator performs that check for the full stroke. IDs must also be unique across shapes. Invalid imports leave the current drawing unchanged.

If the browser environment supports page JavaScript execution, window.magigraph exposes:
- getDesign(): returns an independent copy of the current JSON.
- validate(design): checks structure, unique IDs, 60-object budget and stroke-aware circular containment. Throws on failure; does not alter the drawing.
- setDesign(design): validates, loads and records an undo step.
- getGuide(): returns the construction guide text.

These are ordinary page JavaScript methods, not remotely accessible MCP/HTTP tools. Browser automation tools may forbid page mutation through evaluation; in that case use the visible JSON editor and JSON 적용 button instead. Do not bypass your tool's restrictions.

When finished, return the complete JSON, the total shape count, and a brief account of any simplified details. Do not claim visual fidelity or validation that you did not actually check.

## Editing marker versus JSON translation

For lines and curves, the red move marker is displayed at the midpoint of the transformed endpoints. It is independent of control-point locations and may differ from stored x,y. Dragging it translates the whole shape. Continue using x=0,y=0,size=1,rotation=0 for convenient world-coordinate curve authoring; no recentering is required.
