#!/usr/bin/env python3
"""
Convert a BibTeX entry copied from the clipboard/stdin into the JSON shape
used by assets/data/references.json.

Usage:
    py tools/bibtex_to_reference.py --id 18 < bibtex.txt
    py tools/bibtex_to_reference.py --id 18    # then paste, Ctrl+Z/Enter
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Dict, List, Tuple


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a single BibTeX entry into a references.json object."
    )
    parser.add_argument(
        "--id",
        default="CHANGE_ME",
        help="Reference id to inject (defaults to CHANGE_ME so you can edit manually).",
    )
    args = parser.parse_args()

    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit("No BibTeX content detected on stdin.")

    try:
        reference = convert_bibtex(raw, args.id)
    except ValueError as exc:
        sys.exit(str(exc))

    json_text = json.dumps(reference, ensure_ascii=False, indent=2)
    print(json_text)


def parse_bibtex(src: str) -> Tuple[str, str, Dict[str, str]]:
    header_match = re.match(r"\s*@(\w+)\s*\{\s*([^,]+)\s*,", src, re.IGNORECASE)
    if not header_match:
        return "", "", {}

    entry_type, key = header_match.group(1).lower(), header_match.group(2).strip()
    body = src[header_match.end() :]
    body = body.rsplit("}", 1)[0]  # drop trailing closing brace

    fields: Dict[str, str] = {}
    pattern = re.compile(r"(\w+)\s*=\s*(\{(?:[^{}]*|\{[^{}]*\})*\}|\"[^\"]*\"|[^,\n]+)", re.DOTALL)
    for match in pattern.finditer(body):
        name = match.group(1).lower()
        value = match.group(2).strip().rstrip(",")
        value = value.strip("{}\"")
        fields[name] = clean_tex(value)

    return entry_type, key, fields


def format_authors(raw: str) -> str:
    if not raw:
        return ""

    author_parts = [part.strip() for part in raw.replace("\n", " ").split(" and ") if part.strip()]
    formatted: List[str] = []
    for part in author_parts:
        if "," in part:
            last, first = [p.strip() for p in part.split(",", 1)]
            name = " ".join(filter(None, [first, last]))
        else:
            name = part
        formatted.append(clean_tex(name))

    if not formatted:
        return ""

    if len(formatted) == 1:
        return formatted[0]
    return ", ".join(formatted[:-1]) + " and " + formatted[-1]


def build_venue(entry_type: str, fields: Dict[str, str]) -> str:
    journal_like = (
        fields.pop("journal", "")
        or fields.pop("booktitle", "")
        or fields.pop("publisher", "")
        or fields.pop("address", "")
    )

    pieces: List[str] = []
    if journal_like:
        pieces.append(journal_like)

    volume = fields.pop("volume", "")
    number = fields.pop("number", "")
    pages = fields.pop("pages", "").replace("--", "–")
    year = fields.pop("year", "")

    if volume:
        vol_piece = f"vol. {volume}"
        if number:
            vol_piece += f" ({number})"
        pieces.append(vol_piece)

    if pages:
        pieces.append(f"pp. {pages}")

    if year:
        pieces.append(str(year))

    extra = fields.pop("note", "")
    if extra:
        pieces.append(extra)

    if not pieces:
        return entry_type.capitalize()

    return ", ".join(pieces)


def derive_url(fields: Dict[str, str]) -> str:
    doi = fields.get("doi", "").strip()
    if doi:
        return f"https://doi.org/{doi}"
    url = fields.get("url", "").strip()
    if url:
        return url
    return ""


def clean_tex(value: str) -> str:
    replacements = {
        r"{\`a}": "à",
        r"{\'a}": "á",
        r"{\^a}": "â",
        r"{\~a}": "ã",
        r"{\"a}": "ä",
        r"{\c c}": "ç",
        r"{\'e}": "é",
        r"{\"e}": "ë",
        r"{\'i}": "í",
        r"{\"i}": "ï",
        r"{\~n}": "ñ",
        r"{\'o}": "ó",
        r"{\"o}": "ö",
        r"{\`o}": "ò",
        r"{\^o}": "ô",
        r"{\~o}": "õ",
        r"{\o}": "ø",
        r"{\'u}": "ú",
        r"{\"u}": "ü",
        r"{\ss}": "ß",
        r"{\&}": "&",
        r"\&": "&",
    }

    cleaned = value.strip()
    for tex, replacement in replacements.items():
        cleaned = cleaned.replace(tex, replacement)

    cleaned = re.sub(r"[{}]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def convert_bibtex(bibtex: str, ref_id: str = "CHANGE_ME") -> Dict[str, str]:
    entry_type, key, fields = parse_bibtex(bibtex)
    if not fields:
        raise ValueError("Failed to parse BibTeX fields. Please check the input.")

    fields = dict(fields)  # make a shallow copy we can mutate

    authors = format_authors(fields.pop("author", ""))
    title = clean_tex(fields.pop("title", ""))
    venue = build_venue(entry_type, fields)
    url = derive_url(fields)

    return {
        "id": ref_id,
        "title": title or "Untitled",
        "authors": authors or "Unknown authors",
        "venue": venue or "Unknown venue",
        "url": url or "#",
    }


if __name__ == "__main__":
    main()
