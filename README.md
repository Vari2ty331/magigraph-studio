# Magigraph Studio

마비노기 마기그래프 도안을 만들고 수동으로 따라 그리기 위한 시뮬레이터입니다. 한국어 편집기, 최대 60개 도형, JSON 도안 교환, 선택 도형을 표시하는 Windows 오버레이를 제공합니다.

## Windows 사용자

GitHub Releases의 Windows ZIP을 내려받아 **로컬 디스크에 전체 압축을 풀고** `Magigraph Studio.exe`를 실행하세요. Node.js나 Python 설치는 필요하지 않습니다. 실행 파일과 지원 폴더를 함께 유지하세요. 자동 업데이트는 없으며 새 버전은 ZIP을 다시 내려받아 사용합니다.

오버레이는 사용자가 직접 그리기 위한 시각 안내입니다. 게임 접속, 화면 캡처, 게임 입력 자동화는 하지 않습니다. 상세 사용법은 `desktop/START-HERE.txt`에 있습니다.

## 개발 및 버전 관리

- Node.js와 npm 설치 후 `npm ci`, `npm start`로 개발 버전을 실행합니다.
- `npm test`: 도형·좌표·도안 검증. `npm run test:desktop`: 임시 프로필에서 데스크톱 검증.
- `package.json`의 버전을 올리고 `npm run build:zip`으로 Windows ZIP을 생성합니다.
- 소스 커밋에 버전 태그를 붙이고 GitHub Release에 같은 버전 ZIP을 업로드합니다.
- `node_modules/`, `dist/`, 컴퓨터별 메모와 환경 설정은 Git에 포함하지 않습니다.


Open index.html in a browser, or run `python -m http.server 8765 --bind 127.0.0.1` in this directory and visit http://127.0.0.1:8765.

A standalone planning tool. It has no connection to Mabinogi and cannot send input to the game.

## Drawing
Choose a tool and drag inside the disc. Basic shapes have uniform scale only. Circle size is diameter; square and equilateral triangle size is side length. Drag direction determines rotation. Lines and curves have fixed calibrated width; basic outlines grow with size. The limit is 60 objects, including each whole curve as one object.

Use Select to move a shape, or select it from construction order. Numeric values edit center, scale and rotation. Selected curves expose draggable endpoints and control points. Quadratic curves have one shared control point; cubic curves have two independent control points. Line endpoints are draggable. Every edit checks the entire visible stroke against the circular boundary, rather than merely clipping invalid ink. Curve control points may be outside the disc when the curve itself remains inside. Extremely close boundary cases are conservatively rejected.

Undo/redo, duplication, deletion and construction reordering are supported. Save JSON to keep a portable editable design; the browser also auto-saves locally. A reference image can be displayed centered and fitted inside the disc; it is only a visual aid and is excluded from design exports. Clean preview hides the grid, reference and selection controls. The construction slider reveals successive shapes, and shape numbers plus the text guide aid manual copying.

## Precise / agent editing
The expandable JSON editor, JSON files, and `window.magigraph.getDesign()`, `setDesign(design)`, `validate(design)` expose the same format and validation. No arbitrary executable code is loaded from a design.

A design has `version: 1`, `settings: {stroke: 1.25, outlineRatio: 0.02}`, and a `shapes` array. Each shape needs a unique string `id`, `type`, `x`, `y`, positive `size`, and `rotation` in clockwise degrees. Types are `line`, `circle`, `disc`, `square`, `filled-square`, `triangle`, `filled-triangle`, `quadratic`, `cubic`. Curve `points` are three or four `{x,y}` points in local coordinates, transformed by uniform size, rotation and center translation. Lines use local endpoints (-0.5,0) and (0.5,0).

Disc diameter is 100, centered at (0,0); positive Y points down. Coordinates in the exported construction guide are world coordinates.

## Fidelity assumptions
The screenshots suggest quadratic and cubic Bézier tools. This interpretation and the equilateral triangle geometry need in-game confirmation. The calibration screenshots show a roughly 400-pixel disc and an exactly 5-pixel straight stroke, giving a default stroke of 1.25 units. The square outline defaults to 0.02 times its side length, approximating the soft edge's half-maximum width (about 4px for a 213px side, 1.5px for a 72px side). See CALIBRATION.md for measurement details. Curves retain the same fixed width as straight lines based on the stated game rule. Both can be calibrated without changing code. Glow, colors, effects, extra symbols, game size limits and exact mouse gestures are not replicated. The simulator does not claim pixel-perfect in-game parity.

The Korean calibration panel includes a screenshot preset. Old untouched defaults (1, 0.014) are migrated on restore if every shape remains within the circle; Undo restores the prior values. Customized settings and designs that would fail the new boundary check are preserved. Loaded JSON keeps its own calibration until the preset is applied.

## Interactive transforms
Select a shape with Select / move or the shape list. Drag the center dot to move. For basic shapes, drag the single yellow dot on the lower selection-box edge: distance from center controls uniform size, and angle controls rotation simultaneously. Hold Shift for 15-degree rotation snapping. Lines show only a center and two endpoints: dragging an endpoint changes length and direction with the opposite endpoint fixed. Curves have translation and endpoint/control handles only; their resize/rotation control and size/rotation inspector fields are hidden. Numeric values update while dragging; a whole drag is one undo step. Actual ink must pass the existing stroke-aware boundary checks.

## Game guide overlay
The 안내선 checkbox toggles the screenshot-style guide: solid horizontal/vertical axes, dashed 45-degree diagonals, dashed rings at 25% and 75% of the disc radius, and a solid ring at 50%. This is the default guide. The prior square grid remains a separate optional aid. Guide visibility is independent of clean preview so the game guide can remain over a finished design for manual copying. Guide/grid preferences persist locally and neither overlay counts as a shape or appears in design exports.

## Using another AI
Open 내 AI로 도안 만들기 and copy the self-contained prompt. Give it to any AI with a reference image or description. Import its full JSON through 정밀 편집 · JSON → JSON 적용 (one enclosing JSON code fence is accepted), or load a .json file. For revisions, opt in to including the current design and give the AI a result screenshot. No API key or automatic AI connection is involved. AI-GUIDE.md describes the complete geometry protocol; design.schema.json checks structure and designs/ai-example.json is a valid minimal sample. Schema validation does not prove boundary containment; the simulator remains the final validator.

## Desktop tracing companion (Windows)

The website still runs without dependencies. For an optional transparent desktop overlay, install Node.js, run `npm install` once in this folder, then `npm start`. This opens the same simulator in Electron. Browser localStorage and Electron localStorage are separate; transfer drawings using JSON.

Select a shape, then use 게임 위에 따라 그리기 in the left panel. Set the overlay window X/Y and drawing-circle diameter manually, then press 오버레이 표시. By default only the selected shape and its editing guides appear over other windows; 전체 도안 표시 can show the complete drawing. The cyan alignment circle is optional. The overlay passes mouse clicks through while locked. Enable 위치 맞추기 to drag the overlay, then use 고정 · 따라 그리기 on its top bar to lock it. X/Y controls follow the dropped position and remain available for fine tuning. Ctrl+Shift+M toggles alignment mode. Alignment mode captures clicks inside the overlay; lock it before drawing in the game. X/Y are the outer window's top-left position in desktop logical pixels, including negative positions for monitors to the left/top. The circle center is (X + diameter × 0.55, Y + diameter × 0.55), with 5% padding on every side. Saved alignment is local to this desktop app.

Ctrl+Shift+Space shows/hides the overlay. Ctrl+Shift+Left/Right selects the previous/next shape without focusing the editor. Close the editor to close the overlay and release shortcuts. Shortcut registration may conflict with other applications; the show/hide button remains available. Use windowed/borderless game mode for initial testing; operation over the actual game, exclusive fullscreen and different DPI monitor combinations remains unverified.

The companion does not discover, inspect or control the game, capture its screen, or generate game input. All drawing is manual. This is a local development launch, not a packaged Windows installer.

## Selection guides calibrated from October 18 screenshots

For lines and curves the red translation marker is the midpoint of the world-space endpoints, independently of control points. This is a display/editing pivot; stored JSON translation and geometry are unchanged. The cubic guide shows only the two endpoint-to-control segments, with no control-to-control segment. Quadratic guides connect each endpoint to the shared control; the supplied new screenshots show cubic curves, so quadratic game parity is not established by them.

Handle diameter and guide thickness are adjustable in screen pixels and do not change drawing ink. The overlay preserves those pixel sizes separately from the editor's scale. Markers may still overlap on very small curves; reduce marker size when necessary. Matching endpoints/control points is consistent with a cubic Bézier interpretation, but exact game rasterization and curve parity have not been proven.

Run `npm test` for syntax/geometry checks, or `npm run test:desktop` for the desktop smoke test. The latter briefly opens test windows and writes desktop/smoke-preview.png.

The Windows launcher caches the Electron runtime under %LOCALAPPDATA%/Magigraph Studio/runtime/<version> so Chromium child processes run from a local disk even when the project is on a NAS. Project source remains on the shared drive.

Software rendering is enabled in the companion for stable transparent-window rendering on the tested Windows setup.

Overlay alignment guides now default to the game-style horizontal/vertical axes, dashed diagonals and internal rings at radii 12.5, 25 and 37.5. Enable the game’s 안내선, match the axis intersection for position, then match the solid inner ring for scale using 원 지름. The outer alignment circle is optional and off by default. Overlay guide visibility is separate from the editor’s guide checkbox.

Alignment dragging keeps the overlay non-focusable to avoid activating it over the game. Pointer capture and cursor-position deltas move only the overlay; no game inputs are generated. The game-specific disappearance reported with the earlier native drag mode has not yet been verified as resolved.

If the overlay disappears, 오버레이 다시 표시 restores it at its current position without toggling it off. Pinning now finishes the click before switching to click-through and refreshes the transparent window without activation.

The 등번호 7 선수 도안 preset recreates the supplied back-facing footballer photo as 60 curves, prioritizing the wide-legged pose and number 7. Name, sponsors and background are omitted. Editable JSON, SVG/PNG preview, Korean construction guide and build-footballer.py are in designs/. Browser link: ?design=footballer-seven.

## Extract-and-run Windows release

The release ZIP contains Magigraph Studio.exe and its supporting files. Extract the entire ZIP to a local folder, then double-click Magigraph Studio.exe. No installation or development tools are required. Keep the supporting folders beside the executable. START-HERE.txt includes launch/overlay instructions; AI-GUIDE.md, the schema and editable design JSONs are also available outside the packaged app. Autosaves remain in the existing Magigraph Studio AppData profile.

Developers can run `npm.cmd run build:zip` to create the ZIP in dist/. Builds are staged locally to avoid running Chromium or packaging tools from the NAS. The executable accepts `--self-test` for isolated packaged checks without changing saved drawings.

## Pre-release tracing refinements

The sidebar uses aligned input rows rather than floating fields. X/Y each offer a slider for coarse positioning and a numeric field with one-pixel spinner increments; slider bounds follow connected displays, including negative monitor coordinates, and expand to retain manually entered positions. Window dragging, fields and sliders stay synchronized.

Ctrl+Shift+Left/Right reveals the previous/next selected stroke without focusing the editor, including when the overlay was hidden. The panel also provides previous/next buttons and a stroke counter. Shortcut registration conflicts are reported instead of silently ignored.

Yellow circles mark endpoints; yellow diamonds mark curve controls. Both retain the game's yellow palette, with a red translation circle painted above the guides and other markers, including quadratic curves. Alt-drag can access a curve control that overlaps the red marker. Editor and transparent overlay share the same marker renderer so shape and screen-pixel sizes match.

## Canvas numbering and controls

도형 번호 is independent of 미리보기. Badges attach to actual curve midpoints instead of JSON translation origins, avoid neighboring badges when space permits, and follow construction-order numbering. The selected stroke's badge also appears in the desktop overlay when enabled. Number visibility is saved as a view preference, and preset loading retains it. These are visual guides only; design JSON and SVG art exports do not gain extra shapes.

Previous/next stroke buttons, the selected-stroke counter, and desktop shortcut hints are grouped above the right-hand shape list. 편집 안내점 is a compact legend beside the center canvas, containing endpoint/control/move marker descriptions and marker-size controls. On narrower windows it moves below the canvas instead of covering the artwork.

## Overlay full-drawing view

전체 도안 표시 switches the desktop overlay between all design strokes and the selected stroke only. Full view includes the entire saved design, independently of the editor construction-order slider, while editing handles remain limited to the current selection. Shape numbers follow the same view when enabled. Checking full view also reveals the overlay; unchecking returns to the selected-stroke view without clearing the selection. The preference is saved locally.

Marker sizing is grouped with overlay alignment on the left (and remains available on the left in the browser edition). The center legend only describes marker meanings. Selected-stroke numeric details follow the right-hand stroke-order list. Alignment guidance notes that the game's reference lines are not a perfect circle: prioritize the center crossing and horizontal/vertical axes; use the rings as approximate scale references rather than forcing every circumference to coincide. The simulator's circle geometry is unchanged.

## Quick development preview on Windows

Double-click `Start-Development.cmd` in the project folder to run the current source, including changes on the NAS, without rebuilding or extracting a ZIP. It reads the Electron version from package.json and uses the local runtime cache. If the cache is absent but node_modules/electron/dist is available, it prepares that cache once. Node/npm are not needed for subsequent previews. A new computer without either runtime needs the normal one-time Node.js/npm dependency setup.

Close any older packaged/development copy first to avoid global shortcut conflicts. Close and reopen the development app after source changes; this is not hot reload. Browser and ZIP workflows remain available. Build a distribution ZIP only when explicitly preparing a release. Run `Start-Development.cmd --self-test` to exercise this launcher with an isolated test profile. This launcher never changes the system PATH or PowerShell execution policy.
