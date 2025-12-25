Handwriting Canvas Spec Sheet (Math App, Expo/Skia)
1. Overview

Purpose:
Allow users to handwrite math equations and symbols smoothly and naturally, with low latency, pressure sensitivity, zoom/pan, and export for OCR processing (pix2tex/SymPy).

Target Platforms:

Android (Expo Dev Client)

iOS (Expo Dev Client)

Key Constraints:

Must feel like real ink

Must handle complex math symbols

Must allow undo/redo and erasing

Must export high-quality images or vector data for OCR

2. Technology Stack
Layer	Technology	Notes
UI / Drawing	@shopify/react-native-skia	GPU-accelerated, supports low-latency touch & stylus
App Framework	Expo Dev Client	Needed because Skia is native
Touch Handling	useTouchHandler from Skia	Records strokes, velocity, force
Data Storage	JS state + local storage	Stores strokes as vector paths (for undo/redo)
Export / OCR	PNG or SVG snapshot	For sending to Mathpix or pix2tex
Optional	perfect-freehand	Smooths strokes and applies variable width
3. Core Features
3.1 Drawing

Stroke recording: capture (x, y, t, force) per point

Vector path rendering: create Skia Path objects from stroke points

Smooth curves: optional Bezier / Catmull-Rom smoothing

Pressure sensitivity: optional (Apple Pencil / stylus)

Undo / redo: stroke-level stack

3.2 Canvas Interaction

Pan / Zoom: pinch-to-zoom and drag to navigate canvas

Infinite vertical scroll: for long equations

Eraser mode: remove entire stroke if hit-test intersects

Multi-touch protection: ignore accidental touches

3.3 Export

Image snapshot: render canvas → PNG

Vector snapshot: optionally export stroke points as JSON

Crop auto-detection: optional for OCR

3.4 Performance

Low latency: <16ms per frame for drawing

Fast refresh support: live updates during development

Memory management: clear old strokes if memory exceeds threshold

4. Data Model
type Point = {
  x: number
  y: number
  t: number // timestamp
  force?: number // optional stylus pressure
}

type Stroke = {
  points: Point[]
  color: string
  width: number
}

type CanvasState = {
  strokes: Stroke[]
  undoStack: Stroke[][]
  redoStack: Stroke[][]
  viewport: { zoom: number, offsetX: number, offsetY: number }
}

5. UX / UI Guidelines
Feature	Recommendation
Stroke width	3–6px for default, scale with zoom and pressure
Color	Black ink, allow optional color mode
Background	White, optional grid for alignment
Feedback	Render stroke as-you-draw with no lag
Cursor / highlight	Show stylus tip or touch for precision
Undo / redo	Buttons visible at top or floating action button
Zoom controls	Pinch-to-zoom preferred; optional +/- buttons
6. Touch & Stylus Handling
Property	Notes
onStart	Initialize new Path, record first point
onActive	Append points, update Path in real-time
onEnd	Push Path to stroke stack, clear temporary path
force	Optional stroke width variation (iOS/Android stylus)
palm rejection	Ignore touches that aren’t intended for drawing
7. Export Flow (OCR Integration)

User draws equation

Presses “Submit” or automatic snapshot trigger

Canvas renders Path → PNG / Base64

Optional crop / resize to bounding box

Send to backend / pix2tex

Receive LaTeX / symbolic math

Optionally show editable LaTeX to user

8. Performance Requirements

Frame rate: ≥60 FPS on mid-tier devices

Memory: keep only last 500–1000 strokes in memory, older strokes can be paged off if needed

Latency: <20ms per stroke update

Touch accuracy: <2px deviation between finger/stylus and path

9. Architecture Diagram
Touch Input
    │
    ▼
Touch Handler (useTouchHandler)
    │
    ▼
Stroke Builder → Stroke Stack
    │
    ▼
Skia Canvas Renderer (GPU)
    │
    ▼
UI Layer (Expo Dev Client)
    │
    ▼
Export → PNG / Vector → Backend OCR

10. Optional Enhancements

Multi-color strokes

Background grid / ruled lines for math

Snap-to-grid for alignment

Dynamic stroke smoothing based on velocity

Palm rejection + stylus detection

Stroke replay (for teaching or analysis)