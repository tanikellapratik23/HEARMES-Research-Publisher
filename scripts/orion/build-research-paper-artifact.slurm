#!/bin/bash
# Request values are intentionally supplied by the submitter, not invented by this script.
set -euo pipefail
: "${HEARMES_REPO:?}" "${HEARMES_PDF:?}" "${HEARMES_OUTPUT:?}" "${HEARMES_TITLE:?}" "${HEARMES_CITATION:?}" "${HEARMES_CATEGORY:?}"
module load node.js/22.20.0
cd "$HEARMES_REPO"
mkdir -p "$(dirname "$HEARMES_OUTPUT")"
tmp_dir="${TMPDIR:-/tmp}/hearmes-${SLURM_JOB_ID:-local}"
mkdir -p "$tmp_dir"
trap 'rm -rf "$tmp_dir"' EXIT
python_bin="$HEARMES_REPO/.venv-pdf/bin/python"
if [[ ! -x "$python_bin" ]]; then
  echo "Missing $python_bin. Complete the documented ORION first-time setup on the login node." >&2
  exit 2
fi
"$python_bin" scripts/extract-research-pdf.py "$HEARMES_PDF" "$tmp_dir/pages.json"
npm run knowledge:build -- --input "$tmp_dir/pages.json" --output "$HEARMES_OUTPUT" --title "$HEARMES_TITLE" --citation "$HEARMES_CITATION" --category "$HEARMES_CATEGORY"
