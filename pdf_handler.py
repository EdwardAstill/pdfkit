from pathlib import Path
from typing import Annotated, Optional

import typer
from pypdf import PdfReader, PdfWriter, Transformation

app = typer.Typer(help="PDF handler: extract, combine, impose, rotate, and split PDFs.")


def _parse_page_range(spec: str, total: int) -> list[int]:
    """Parse a page range like '1,3,5-8' into 0-based indices."""
    pages = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            pages.extend(range(int(start) - 1, int(end)))
        else:
            pages.append(int(part) - 1)
    return [p for p in pages if 0 <= p < total]


@app.command()
def extract(
    input: Annotated[Path, typer.Argument(help="Input PDF file")],
    pages: Annotated[str, typer.Argument(help="Pages to extract, e.g. '1,3,5-8'")],
    output: Annotated[Optional[Path], typer.Option("-o", "--output", help="Output file")] = None,
):
    """Extract specific pages from a PDF."""
    reader = PdfReader(input)
    total = len(reader.pages)
    indices = _parse_page_range(pages, total)
    if not indices:
        typer.echo(f"No valid pages in '{pages}' (PDF has {total} pages).", err=True)
        raise typer.Exit(1)

    writer = PdfWriter()
    for i in indices:
        writer.add_page(reader.pages[i])

    out = output or input.with_stem(f"{input.stem}_extracted")
    with open(out, "wb") as f:
        writer.write(f)
    typer.echo(f"Extracted {len(indices)} page(s) → {out}")


@app.command()
def combine(
    inputs: Annotated[list[Path], typer.Argument(help="PDF files to combine (in order)")],
    output: Annotated[Optional[Path], typer.Option("-o", "--output", help="Output file")] = None,
):
    """Combine multiple PDFs into one."""
    if len(inputs) < 2:
        typer.echo("Provide at least two PDF files to combine.", err=True)
        raise typer.Exit(1)

    writer = PdfWriter()
    total = 0
    for path in inputs:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)
        total += len(reader.pages)

    out = output or inputs[0].with_stem("combined")
    with open(out, "wb") as f:
        writer.write(f)
    typer.echo(f"Combined {len(inputs)} file(s), {total} page(s) → {out}")


@app.command()
def rotate(
    input: Annotated[Path, typer.Argument(help="Input PDF file")],
    angle: Annotated[int, typer.Argument(help="Rotation angle: 90, 180, or 270")],
    pages: Annotated[Optional[str], typer.Option("-p", "--pages", help="Pages to rotate, e.g. '1,3,5-8' (default: all)")] = None,
    output: Annotated[Optional[Path], typer.Option("-o", "--output", help="Output file")] = None,
):
    """Rotate pages in a PDF."""
    if angle not in (90, 180, 270, -90, -180, -270):
        typer.echo("Angle must be 90, 180, or 270 (positive or negative).", err=True)
        raise typer.Exit(1)

    reader = PdfReader(input)
    total = len(reader.pages)
    indices = set(_parse_page_range(pages, total) if pages else range(total))

    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if i in indices:
            page.rotate(angle)
        writer.add_page(page)

    out = output or input.with_stem(f"{input.stem}_rotated")
    with open(out, "wb") as f:
        writer.write(f)
    typer.echo(f"Rotated {len(indices)} page(s) by {angle}° → {out}")


@app.command()
def impose(
    input: Annotated[Path, typer.Argument(help="Input PDF file")],
    output: Annotated[Optional[Path], typer.Option("-o", "--output", help="Output file")] = None,
    nup: Annotated[str, typer.Option("--nup", help="Layout: '2x1', '2x2', '3x2', etc.")] = "2x1",
    booklet: Annotated[bool, typer.Option("--booklet", help="Arrange pages for saddle-stitch booklet printing")] = False,
):
    """Impose PDF pages onto larger sheets (n-up or booklet layout)."""
    reader = PdfReader(input)
    pages = list(reader.pages)
    n = len(pages)

    if booklet:
        # Pad to multiple of 4
        while len(pages) % 4 != 0:
            writer_tmp = PdfWriter()
            writer_tmp.add_blank_page(
                width=float(pages[0].mediabox.width),
                height=float(pages[0].mediabox.height),
            )
            pages.append(writer_tmp.pages[0])

        # Build booklet order: last, first, second, second-to-last, ...
        ordered = []
        left, right = 0, len(pages) - 1
        while left < right:
            ordered.append((pages[right], pages[left]))      # front sheet
            ordered.append((pages[left + 1], pages[right - 1]))  # back sheet
            left += 2
            right -= 2

        page_w = float(pages[0].mediabox.width)
        page_h = float(pages[0].mediabox.height)
        writer = PdfWriter()

        for left_page, right_page in ordered:
            sheet = writer.add_blank_page(width=page_w * 2, height=page_h)
            sheet.merge_transformed_page(left_page, Transformation(), over=True, expand=False)
            sheet.merge_transformed_page(
                right_page,
                Transformation().translate(tx=page_w, ty=0),
                over=True,
                expand=False,
            )

        out = output or input.with_stem(f"{input.stem}_booklet")
        with open(out, "wb") as f:
            writer.write(f)
        typer.echo(f"Booklet imposition: {n} pages → {len(ordered)} sheet(s) → {out}")
        return

    # N-up layout
    try:
        cols_str, rows_str = nup.lower().split("x")
        cols, rows = int(cols_str), int(rows_str)
    except ValueError:
        typer.echo("--nup must be in ColsxRows format, e.g. '2x2'.", err=True)
        raise typer.Exit(1)

    per_sheet = cols * rows
    page_w = float(pages[0].mediabox.width)
    page_h = float(pages[0].mediabox.height)
    cell_w = page_w / cols
    cell_h = page_h / rows

    writer = PdfWriter()
    for sheet_start in range(0, len(pages), per_sheet):
        sheet = writer.add_blank_page(width=page_w, height=page_h)
        for slot, page in enumerate(pages[sheet_start: sheet_start + per_sheet]):
            col = slot % cols
            row = rows - 1 - (slot // cols)  # top-to-bottom
            sx = cell_w / float(page.mediabox.width)
            sy = cell_h / float(page.mediabox.height)
            scale = min(sx, sy)
            tx = col * cell_w
            ty = row * cell_h
            t = Transformation().scale(scale, scale).translate(tx=tx, ty=ty)
            sheet.merge_transformed_page(page, t, over=True, expand=False)

    total_sheets = (len(pages) + per_sheet - 1) // per_sheet
    out = output or input.with_stem(f"{input.stem}_{nup}")
    with open(out, "wb") as f:
        writer.write(f)
    typer.echo(f"{nup} imposition: {n} pages → {total_sheets} sheet(s) → {out}")


@app.command()
def split(
    input: Annotated[Path, typer.Argument(help="Input PDF file")],
    output_dir: Annotated[Optional[Path], typer.Option("-o", "--output-dir", help="Directory for output files")] = None,
    every: Annotated[int, typer.Option("--every", help="Split every N pages")] = 1,
):
    """Split a PDF into individual pages or chunks."""
    reader = PdfReader(input)
    total = len(reader.pages)
    out_dir = output_dir or input.parent / input.stem
    out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    for chunk_start in range(0, total, every):
        writer = PdfWriter()
        chunk = reader.pages[chunk_start: chunk_start + every]
        for page in chunk:
            writer.add_page(page)
        chunk_end = min(chunk_start + every, total)
        label = f"{chunk_start + 1}" if every == 1 else f"{chunk_start + 1}-{chunk_end}"
        out_file = out_dir / f"{input.stem}_p{label}.pdf"
        with open(out_file, "wb") as f:
            writer.write(f)
        written += 1

    typer.echo(f"Split {total} page(s) into {written} file(s) → {out_dir}/")


@app.command()
def info(
    input: Annotated[Path, typer.Argument(help="Input PDF file")],
):
    """Show metadata and page count for a PDF."""
    reader = PdfReader(input)
    typer.echo(f"File   : {input}")
    typer.echo(f"Pages  : {len(reader.pages)}")
    meta = reader.metadata
    if meta:
        for key in ("/Title", "/Author", "/Creator", "/Producer", "/CreationDate", "/ModDate"):
            val = meta.get(key)
            if val:
                typer.echo(f"{key[1:]:<12}: {val}")
    p0 = reader.pages[0]
    w = float(p0.mediabox.width)
    h = float(p0.mediabox.height)
    typer.echo(f"Page size: {w:.1f} x {h:.1f} pt  ({w/72:.2f} x {h/72:.2f} in)")


if __name__ == "__main__":
    app()
