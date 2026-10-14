"""Render private contact sheets for corpus rows that require visual review."""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


def anchors(page: fitz.Page, left: float, split: float) -> list[float]:
    blocks = page.get_text("blocks", clip=fitz.Rect(left + .5, 100, split - .5, 820), sort=True)
    blocks = [block for block in blocks if block[4].strip()]
    if len(blocks) != 20:
        raise ValueError(f"expected 20 rows, found {len(blocks)}")
    return [block[1] for block in blocks]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", required=True)
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--per-sheet", type=int, default=10)
    args = parser.parse_args()

    audit = json.loads(Path(args.audit).read_text(encoding="utf-8"))
    document = fitz.open(args.pdf)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    rows = []
    matrix = fitz.Matrix(3, 3)
    columns = ((45, 59.52, 299.4), (300, 327.72, 564.84))
    cache = {}
    for issue in audit["issues"]:
        day, number = issue["day"], issue["no"]
        page = document[day - 1]
        half, index = (number - 1) // 20, (number - 1) % 20
        _, left, right = columns[half]
        key = (day, half)
        if key not in cache:
            split = 179.4 if half == 0 else 446.28
            cache[key] = anchors(page, left, split)
        ys = cache[key]
        before = ys[index - 1] if index else ys[index] - (ys[index + 1] - ys[index])
        after = ys[index + 1] if index < 19 else ys[index] + (ys[index] - ys[index - 1])
        top = max(100, (before + ys[index]) / 2 - 4)
        bottom = min(820, (ys[index] + after) / 2 + 7)
        pixmap = page.get_pixmap(matrix=matrix, clip=fitz.Rect(left, top, right, bottom), alpha=False)
        crop = Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
        canvas = Image.new("RGB", (crop.width, crop.height + 28), "white")
        ImageDraw.Draw(canvas).text((6, 6), f"DAY {day:02d} / {number:02d} / {issue['htmlEnglish']}", fill="black")
        canvas.paste(crop, (0, 28))
        rows.append(canvas)

    for offset in range(0, len(rows), args.per_sheet):
        group = rows[offset:offset + args.per_sheet]
        width, height = max(row.width for row in group), sum(row.height for row in group)
        sheet = Image.new("RGB", (width, height), "white")
        y = 0
        for row in group:
            sheet.paste(row, (0, y))
            y += row.height
        sheet.save(output / f"review-{offset // args.per_sheet + 1:02d}.png")
    print(f"Rendered {len(rows)} issue rows to {(len(rows) + args.per_sheet - 1) // args.per_sheet} contact sheets")


if __name__ == "__main__":
    main()
