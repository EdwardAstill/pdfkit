# PDFKit

A browser-based PDF editor and annotation tool. Fully client-side — no server, no uploads, your files stay on your machine.

## Features

### PDF Operations
- **Extract** — Pull specific pages out of a PDF by page range (e.g. `1,3,5-8`)
- **Combine** — Merge multiple PDF files into one document
- **Rotate** — Rotate selected pages by 90/180/270 degrees
- **Split** — Split a document every N pages into separate files
- **Impose (N-Up)** — Place multiple pages on each sheet in a grid layout, with portrait/landscape orientation control
- **Impose (Booklet)** — Reorder pages for saddle-stitch booklet printing (fold and staple)
- **Info** — View PDF metadata (title, author, page count, dimensions, dates)

### Text Editing
- **Double-click any text** on the Pages tab to edit it inline
- Edited text items are highlighted with a blue underline
- On export, original text is covered with a white rectangle and the replacement is written on top
- Uses pdfjs-dist's `getTextContent()` to extract real text strings and positions — not OCR

### Annotations
- **Shapes** — Rectangle, ellipse, line, arrow
- **Text** — Click to place, double-click to edit inline with auto-resize
- **Selection** — Click to select, drag to move, handles to resize/rotate
- **Shift-constrain** — Hold Shift while drawing for squares, circles, and 45-degree angle snapping
- **Center-origin ellipse** — Click sets the center, drag sets the radius
- **Style controls** — Stroke color, fill color (with on/off toggle), stroke width, font size
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y), per-page history
- **Delete** — Select an annotation and press Delete or Backspace
- **Duplicate** — Ctrl+D to duplicate the selected annotation

### Export
- **Native annotations** (default) — Exports as real PDF `/Annot` entries (`/Square`, `/Circle`, `/Line`, `/FreeText`). These are editable in Acrobat, Preview, and other PDF readers.
- **Flattened** — Bakes annotations into the page content stream as permanent, non-editable drawing operations. Toggle between modes with the ANNOT/FLAT button next to Export.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| R | Rectangle tool |
| O | Ellipse tool |
| L | Line tool |
| A | Arrow tool |
| T | Text tool |
| Escape | Deselect / switch to select |
| Delete / Backspace | Remove selected annotation |
| Ctrl+D | Duplicate selected |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Shift (hold) | Constrain proportions while drawing |

## Tech Stack

| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| TypeScript 5.9 | Type safety |
| Vite 8 | Build tool |
| pdfjs-dist | Render PDF pages to canvas |
| pdf-lib | Create/modify PDFs (operations + annotation export) |
| Konva + react-konva | Interactive annotation canvas |
| Zustand | State management |

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

Open `http://localhost:5173` in your browser. Drop a PDF or click "Open" to load one.

## Architecture

### Dual-Document Model
Every loaded PDF is held as two parallel documents:
- **pdfjs-dist** document — for rendering pages to canvas and extracting text content
- **pdf-lib** document — for manipulation (extract, combine, rotate, etc.) and export

Both are stored in the Zustand `usePdfStore`.

### Annotation System
Annotations are managed as typed shape objects (`RectShape`, `EllipseShape`, `LineShape`, `ArrowShape`, `TextShape`) stored per page in `useAnnotationStore`. The system is split into focused modules:

| Module | Responsibility |
|--------|---------------|
| `useAnnotationStore` | Shape CRUD, per-page undo/redo history, active tool & style state |
| `useDrawing` hook | Shape drawing lifecycle (mousedown/move/up), shift-constrain, center-origin ellipse |
| `useAnnotationKeys` hook | Keyboard shortcuts (tool switch, undo/redo, delete, duplicate) |
| `ShapeRenderer` | Renders individual shapes as Konva elements with selection glow, drag, transform |
| `TextEditor` | HTML textarea overlay for inline text editing with auto-resize and font matching |
| `AnnotationLayer` | Thin orchestrator wiring hooks and components onto each PDF page |

### Text Editing System
Text editing extracts real text strings from the PDF content stream via pdfjs-dist's `getTextContent()` API. Each text item is stored with both canvas-space and PDF-space coordinates. The `TextOverlay` component renders invisible hit targets over each text item; double-clicking opens an inline editor. On export, edits are applied by drawing a white rectangle over the original text position and writing the replacement text on top via pdf-lib. This is the same approach used by most PDF editors since PDF content streams can't be surgically modified.

### Export Modes

**Native annotations** (`/Annot` mode) write shapes as PDF annotation dictionary entries via pdf-lib's low-level API (`page.node.addAnnot()`). These appear in the annotations panel of PDF readers and can be individually selected, edited, or removed.

**Flattened** mode writes shapes as `drawRectangle`, `drawEllipse`, `drawLine`, `drawText` calls into the page content stream. The marks become part of the page — permanent and non-editable.

### Coordinate Mapping (Canvas to PDF)
```
pdfX = canvasX / renderScale
pdfY = pageHeightPts - (canvasY / renderScale)
```

### Project Structure

```
src/
  components/
    annotation/       # Konva canvas overlay, toolbar, property panel, shape renderer, text editor
    layout/           # App shell, header with tabs, context-sensitive tool strip
    operations/       # Modal dialogs for PDF operations (extract, combine, rotate, split, impose, info)
    pdf/              # PDF viewer, page renderer, sidebar thumbnails, drop zone
  hooks/
    useDrawing.ts         # Shape drawing with shift-constrain and center-origin ellipse
    useAnnotationKeys.ts  # Keyboard shortcuts for annotation tools
    useTextExtract.ts     # Extracts text items from PDF pages via pdfjs getTextContent()
    usePdfRenderer.ts     # Renders a PDF page to a canvas element
    useFileHandler.ts     # Handles file open/drop
  lib/
    annotationSerializer.ts  # Writes shapes as native PDF annotations or flattened draw calls
    textEditExport.ts     # Applies text edits to PDF (white-out + replacement)
    pdfExport.ts          # Orchestrates PDF export (annotations + text edits)
    pdfOperations.ts      # Extract, combine, rotate, split, impose operations
    pdfLoader.ts          # Loads PDF bytes into pdfjs-dist and pdf-lib documents
    pageRange.ts          # Parses page range strings (e.g. "1,3,5-8")
  store/
    usePdfStore.ts        # PDF document state (pages, bytes, metadata)
    useAnnotationStore.ts # Annotation shapes, undo/redo history, tool & style state
    useTextEditStore.ts   # Text edit state (extracted items, edits map)
  types/
    annotation.ts     # Shape type hierarchy (RectShape, EllipseShape, etc.)
    textEdit.ts       # PDF text item and text edit types
    pdf.ts            # PDF page info types
  utils/
    download.ts       # Triggers browser file download from bytes
```
