"""Build one private DAY1-48 import pack after PDF/HTML and visual review.

The generated JSON contains copyrighted source data and must remain outside Git.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_digest(path: Path) -> str:
    return digest(path.read_bytes())


def issue_digest(issues: list[dict]) -> str:
    payload = [(item["day"], item["no"], item["htmlEnglish"], item["rawPdfMeaning"]) for item in issues]
    data = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
    return digest(data)


def first_pdf_meaning(raw: str, replacements: dict[str, str]) -> str:
    text = unicodedata.normalize("NFC", raw).strip()
    for old, new in replacements.items():
        text = text.replace(old, new)
    cuts = [position for token in (",", "\n", ". ") if (position := text.find(token)) >= 0]
    return text[:min(cuts)].strip() if cuts else text


def grading_answer(first: str) -> str:
    return re.sub(r"^\([^()]*\)\s*", "", first).strip()


def card(word: dict) -> dict:
    answer = word["answer"]
    return {
        "no": word["no"],
        "english": word["english"],
        "emoji": "📘",
        "cue": f"첫 번째 뜻 ‘{answer}’ 떠올리기",
        "sentence": ["이 단어를 보면 먼저", f" ‘{answer}’라는 뜻을 떠올린다."],
        "middle": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", required=True)
    parser.add_argument("--resolution", required=True)
    parser.add_argument("--day48", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    audit_path, resolution_path = Path(args.audit), Path(args.resolution)
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    resolution = json.loads(resolution_path.read_text(encoding="utf-8"))
    day48_pack = json.loads(Path(args.day48).read_text(encoding="utf-8"))
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    if audit.get("totalRows") != 1880 or audit.get("autoMatchedRows") != 1700:
        raise ValueError("expected the audited DAY1-47 corpus: 1,880 rows / 1,700 automatic matches")
    if audit.get("visualReviewRequiredRows") != 180 or audit.get("scope") != {"firstDay": 1, "lastDay": 47}:
        raise ValueError("unexpected visual-review issue set")
    if resolution.get("format") != "wm2000-private-visual-resolution" or resolution.get("schema") != 1:
        raise ValueError("invalid visual resolution file")
    if not resolution.get("visuallyReviewed") or resolution.get("reviewedIssueCount") != 180:
        raise ValueError("all 180 source differences must be visually reviewed")
    if resolution.get("auditSha256") != file_digest(audit_path):
        raise ValueError("audit changed after visual review")
    if resolution.get("reviewedIssuesSha256") != issue_digest(audit["issues"]):
        raise ValueError("reviewed issue set changed")

    issue_keys = {(item["day"], item["no"]) for item in audit["issues"]}
    corrections = resolution.get("corrections", {})
    days, learning = [], {}
    changed_meanings = 0
    for day_audit in audit["audits"]:
        day, words = day_audit["day"], []
        for entry in day_audit["entries"]:
            key = (day, entry["no"])
            first, full = entry["sourceFirstMeaning"], entry["sourceFullMeaning"]
            if key in issue_keys:
                first = first_pdf_meaning(entry["rawPdfMeaning"], resolution.get("glyphReplacements", {}))
                correction = corrections.get(f"{day}:{entry['no']}")
                if correction:
                    if correction.get("english") != entry["htmlEnglish"]:
                        raise ValueError(f"correction English mismatch for DAY {day} / {entry['no']}")
                    first = correction["firstMeaning"]
                full = first
                changed_meanings += 1
            answer = grading_answer(first)
            if not answer:
                raise ValueError(f"empty answer for DAY {day} / {entry['no']}")
            words.append({
                "day": day,
                "no": entry["no"],
                "english": entry["htmlEnglish"],
                "answer": answer,
                "sourceFirstMeaning": first,
                "sourceFullMeaning": full,
                "sourceOrdinal": entry["sourceOrdinal"],
            })
        if len(words) != 40 or any(word["sourceOrdinal"] != (day - 1) * 40 + word["no"] for word in words):
            raise ValueError(f"invalid DAY {day} order")
        days.append({"day": day, "words": words})
        learning[f"day{day}"] = [card(word) for word in words]

    if changed_meanings != 180:
        raise ValueError("not all reviewed meaning differences were applied")
    if day48_pack.get("format") != "wm2000-personal-words" or day48_pack.get("schema") != 1:
        raise ValueError("invalid DAY48 pack")
    if [item.get("day") for item in day48_pack.get("days", [])] != [48]:
        raise ValueError("the supplied existing pack must contain only DAY48")
    days.append(day48_pack["days"][0])
    learning["day48"] = day48_pack["learning"]["day48"]
    days.sort(key=lambda item: item["day"], reverse=True)

    pack = {
        "format": "wm2000-personal-words",
        "schema": 1,
        "days": days,
        "learning": learning,
        "validation": {
            "status": "html-pdf-cross-audited-and-differences-visually-reviewed",
            "dayRange": [1, 48],
            "count": 1920,
            "day1To47EnglishOrderMatches": 1880,
            "day1To47AutomaticMeaningMatches": 1700,
            "day1To47VisuallyReviewedMeaningDifferences": 180,
            "day48ImportedFromExistingVerifiedPack": True,
            "reviewer": resolution["reviewer"],
            "reviewedAt": resolution["reviewedAt"],
            "htmlSha256": audit["htmlSha256"],
            "pdfSha256": audit["pdfSha256"],
            "auditSha256": file_digest(audit_path),
            "resolutionSha256": file_digest(resolution_path),
        },
        "publication": {"status": "permission-unconfirmed", "scope": "personal-device"},
    }
    pack_bytes = (json.dumps(pack, ensure_ascii=False, indent=2) + "\n").encode()
    pack_path = output / "WM2000_DAY1-48_개인용_검증팩.json"
    pack_path.write_bytes(pack_bytes)
    manifest = {
        "format": "wm2000-private-pack-manifest",
        "schema": 1,
        "pack": pack_path.name,
        "packSha256": digest(pack_bytes),
        "days": 48,
        "words": 1920,
        "publicBuiltInDays": [49, 50],
        "totalAvailableAfterImport": 2000,
        "meaningPolicy": "PDF first-listed meaning for 180 reviewed differences; matching HTML/PDF first meaning otherwise",
        "corrections": corrections,
        "publication": pack["publication"],
    }
    (output / "검증팩_매니페스트.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"PASS: DAY1-48 / 1,920 private words / combined total 2,000 / {digest(pack_bytes)}")


if __name__ == "__main__":
    main()
