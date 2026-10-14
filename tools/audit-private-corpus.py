"""Audit the supplied private 2,000-word HTML against the supplied 50-page PDF.

This tool writes only to the requested private output directory. It does not
declare visual review complete: exact text matches are recorded separately from
rows that need a rendered-page check.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

import fitz


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_words(path: Path) -> list[list]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"\bconst\s+WORDS\s*=\s*", text)
    if not match or text[match.end():match.end() + 1] != "[":
        raise ValueError("const WORDS JSON array not found")
    decoder = json.JSONDecoder()
    rows, _ = decoder.raw_decode(text[match.end():])
    if len(rows) != 2000:
        raise ValueError("expected exactly 2,000 rows")
    for index, row in enumerate(rows, 1):
        if not isinstance(row, list) or len(row) != 5 or row[0] != index:
            raise ValueError(f"invalid or non-sequential row {index}")
    return rows


def first_meaning(text: str) -> str:
    depth = 0
    for index, char in enumerate(text):
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
        elif char == "," and depth == 0:
            return text[:index].strip()
        if depth < 0:
            raise ValueError(f"unbalanced meaning: {text}")
    if depth:
        raise ValueError(f"unbalanced meaning: {text}")
    return text.strip()


def canonical(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower()
    return "".join(char for char in text if char.isalnum())


def characters(page: fitz.Page, clip: fitz.Rect) -> list[tuple[float, float, str]]:
    result = []
    for block in page.get_text("rawdict", clip=clip, sort=False)["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                for char in span.get("chars", []):
                    result.append((char["bbox"][0], char["bbox"][1], char["c"]))
    return result


def ordered_text(chars: list[tuple[float, float, str]]) -> str:
    # PDF punctuation is stored in overlapping spans. Character coordinates,
    # unlike get_text(sort=True), recover commas in their visual positions.
    lines: list[list[tuple[float, float, str]]] = []
    for char in sorted(chars, key=lambda item: (item[1], item[0])):
        if not lines or abs(lines[-1][0][1] - char[1]) > 2:
            lines.append([char])
        else:
            lines[-1].append(char)
    return "\n".join("".join(char[2] for char in sorted(line, key=lambda item: item[0])).strip() for line in lines).strip()


def page_entries(page: fitz.Page) -> list[dict]:
    entries = []
    columns = ((59.52, 179.4, 299.4), (327.72, 446.28, 564.84))
    for half, (left, split, right) in enumerate(columns):
        english_blocks = page.get_text(
            "blocks", clip=fitz.Rect(left + .5, 100, split - .5, 820), sort=True
        )
        english_blocks = [block for block in english_blocks if block[4].strip()]
        if len(english_blocks) != 20:
            raise ValueError(f"expected 20 English rows in PDF column, found {len(english_blocks)}")
        anchors = [block[1] for block in english_blocks]
        buckets: list[list[tuple[float, float, str]]] = [[] for _ in anchors]
        for char in characters(page, fitz.Rect(split + .5, 100, right - .5, 820)):
            nearest = min(range(20), key=lambda index: abs(anchors[index] - char[1]))
            buckets[nearest].append(char)
        for row, (block, meaning_chars) in enumerate(zip(english_blocks, buckets)):
            entries.append({
                "no": half * 20 + row + 1,
                "pdfEnglish": block[4].strip().replace("\n", " "),
                "rawPdfMeaning": ordered_text(meaning_chars),
            })
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", required=True)
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--output", default=".private/bulk-audit")
    parser.add_argument("--first-day", type=int, default=1)
    parser.add_argument("--last-day", type=int, default=47)
    parser.add_argument("--render-all", action="store_true")
    args = parser.parse_args()

    html, pdf, output = Path(args.html), Path(args.pdf), Path(args.output)
    if not 1 <= args.first_day <= args.last_day <= 48:
        parser.error("day range must be within 1..48")
    rows = extract_words(html)
    document = fitz.open(pdf)
    if len(document) != 50:
        raise ValueError("expected the supplied 50-page PDF")
    output.mkdir(parents=True, exist_ok=True)

    audits, issues = [], []
    for day in range(args.first_day, args.last_day + 1):
        page = document[day - 1]
        if not re.search(rf"DAY\s*{day}\b", page.get_text()):
            raise ValueError(f"PDF page {day} does not contain DAY {day}")
        extracted = page_entries(page)
        day_rows = rows[(day - 1) * 40:day * 40]
        day_entries = []
        for index, (source, pdf_row) in enumerate(zip(day_rows, extracted), 1):
            source_first = first_meaning(source[4])
            english_ok = canonical(pdf_row["pdfEnglish"]) == canonical(source[3])
            pdf_meaning = canonical(pdf_row["rawPdfMeaning"])
            source_meaning = canonical(source_first)
            meaning_ok = bool(source_meaning) and pdf_meaning.startswith(source_meaning)
            entry = {
                "day": day,
                "no": index,
                "sourceOrdinal": source[0],
                "htmlEnglish": source[3],
                "pdfEnglish": pdf_row["pdfEnglish"],
                "sourceFirstMeaning": source_first,
                "sourceFullMeaning": source[4],
                "rawPdfMeaning": pdf_row["rawPdfMeaning"],
                "englishExact": english_ok,
                "firstMeaningPrefix": meaning_ok,
                "status": "AUTO_MATCH" if english_ok and meaning_ok else "VISUAL_REVIEW_REQUIRED",
            }
            day_entries.append(entry)
            if entry["status"] != "AUTO_MATCH":
                issues.append(entry)
        audits.append({"day": day, "entries": day_entries})
        if args.render_all or any(item["day"] == day for item in issues):
            page.get_pixmap(matrix=fitz.Matrix(2, 2)).save(str(output / f"DAY{day:02d}_page.png"))

    summary = {
        "format": "wm2000-private-corpus-audit",
        "schema": 1,
        "scope": {"firstDay": args.first_day, "lastDay": args.last_day},
        "htmlSha256": sha256(html),
        "pdfSha256": sha256(pdf),
        "totalRows": sum(len(day["entries"]) for day in audits),
        "autoMatchedRows": sum(entry["status"] == "AUTO_MATCH" for day in audits for entry in day["entries"]),
        "visualReviewRequiredRows": len(issues),
        "daysWithIssues": sorted({entry["day"] for entry in issues}),
        "publication": {"status": "permission-unconfirmed", "scope": "personal-device"},
        "audits": audits,
        "issues": issues,
    }
    (output / "corpus-audit.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"AUDIT: {summary['totalRows']} rows; {summary['autoMatchedRows']} automatic exact/prefix matches; "
        f"{summary['visualReviewRequiredRows']} require rendered-page review across "
        f"{len(summary['daysWithIssues'])} days"
    )


if __name__ == "__main__":
    main()
