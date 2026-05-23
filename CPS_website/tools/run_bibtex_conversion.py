"""
Set REF_ID, BIBTEX, and (optionally) URL_OVERRIDE below, then run this file
directly from your IDE. The script converts the BibTeX entry and appends or
updates the matching record inside assets/data/references.json.
"""

from __future__ import annotations

import json
from pathlib import Path

from bibtex_to_reference import convert_bibtex

# 1) Reference label used in index.html data-ref attributes.
REF_ID = "AP3"

# 2) Paste the BibTeX entry here (keep the triple quotes).
BIBTEX = r"""
@article{kwon2025coupling,
  title={Coupling composite schemes with different time steps for multi-scale structural dynamics},
  author={Kwon, Sun-Beom and Prakash, Arun},
  journal={International Journal for Multiscale Computational Engineering},
  volume={23},
  number={3},
  year={2025},
  publisher={Begel House Inc.}
}
""".strip()

# 3) Optional: override the URL saved in references.json.
#    Leave as "" to keep the URL/DOI discovered in the BibTeX (or "#").
URL_OVERRIDE = "https://www.dl.begellhouse.com/journals/61fd1b191cf7e96f,222eb7aa7bfee3a0,53e799f666e63fe2.html"

# 4) Set to False if you want a dry-run preview without touching the file.
WRITE_TO_FILE = True


def main() -> None:
    if not BIBTEX or REF_ID == "CHANGE_ME":
        raise SystemExit("Please update REF_ID and BIBTEX before running.")

    reference = convert_bibtex(BIBTEX, REF_ID)
    if URL_OVERRIDE:
        reference["url"] = URL_OVERRIDE

    references_path = (
        Path(__file__).resolve().parents[1] / "assets" / "data" / "references.json"
    )

    try:
        current = json.loads(references_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"Could not find {references_path}.")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Failed to parse {references_path}: {exc}")

    if not isinstance(current, list):
        raise SystemExit(f"{references_path} does not contain a JSON array.")

    existing_index = next(
        (idx for idx, item in enumerate(current) if str(item.get("id")) == REF_ID),
        None,
    )
    action = "updated" if existing_index is not None else "appended"

    if existing_index is not None:
        current[existing_index] = reference
    else:
        current.append(reference)

    output = json.dumps(reference, ensure_ascii=False, indent=2)
    print(f"\n{output}\n")
    print(f"Reference will be {action} in {references_path}.")

    if WRITE_TO_FILE:
        references_path.write_text(
            json.dumps(current, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print("✔ File saved.")
    else:
        print("✱ WRITE_TO_FILE is False; no changes were written.")


if __name__ == "__main__":
    main()
