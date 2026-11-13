#!/usr/bin/env python3
"""Extract readable text from a research PDF to the JSON format used by this publisher."""
import json
import sys
from pathlib import Path
from pypdf import PdfReader

if len(sys.argv) != 3:
    raise SystemExit("Usage: extract-research-pdf.py INPUT.pdf OUTPUT.json")
input_path, output_path = map(Path, sys.argv[1:])
reader = PdfReader(str(input_path))
pages = [{"page": i + 1, "text": page.extract_text() or ""} for i, page in enumerate(reader.pages)]
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
print(f"Extracted {len(pages)} pages to {output_path}")
