#!/usr/bin/env python3
"""Run every Python code block in the theory articles and lint the Markdown.

For each article under content/theory/, all ```python blocks are joined in order
into a single program (so later blocks can use names defined earlier) and executed
with an empty stdin and a time limit. A block whose fence info contains `skip`
(```python skip) is excluded, e.g. for deliberately slow or failing examples.

Usage:
    python3 scripts/check-theory-code.py                # all articles
    python3 scripts/check-theory-code.py graphs/dijkstra.md math/   # a subset
"""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "theory"
TIMEOUT_S = 30

FENCE_RE = re.compile(r"^```([^\n]*)\n(.*?)^```[ \t]*$", re.S | re.M)


def python_blocks(text: str) -> list[str]:
    blocks = []
    for m in FENCE_RE.finditer(text):
        info = m.group(1).split()
        if info and info[0] in ("python", "py") and "skip" not in info[1:]:
            blocks.append(m.group(2))
    return blocks


LINK_RE = re.compile(r"\]\((/theory/[^)#\s]*)(#[^)\s]*)?\)")


def link_targets_exist(text: str) -> list[str]:
    missing = []
    for m in LINK_RE.finditer(FENCE_RE.sub("", text)):
        parts = m.group(1).strip("/").split("/")[1:]  # drop "theory"
        if len(parts) == 1 and (CONTENT / parts[0]).is_dir():
            continue
        if len(parts) == 2 and (CONTENT / parts[0] / f"{parts[1]}.md").is_file():
            continue
        if not parts:
            continue
        missing.append(f"broken internal link: {m.group(1)}")
    return missing


def lint(path: Path, text: str) -> list[str]:
    problems = link_targets_exist(text)
    body = FENCE_RE.sub("", text)  # ignore code
    for n, line in enumerate(body.splitlines(), 1):
        s = line.strip()
        if len(s) > 4 and s.startswith("$$") and s.endswith("$$"):
            problems.append(f"single-line $$ (renders inline; use a multi-line block): {s[:50]}")
        if "\t" in line:
            problems.append("tab character in prose")
    if body.count("$$") % 2:
        problems.append("unbalanced $$ delimiters")
    if not text.startswith("---\n"):
        problems.append("missing front-matter")
    return problems


def check(path: Path) -> tuple[Path, list[str]]:
    text = path.read_text(encoding="utf8")
    errors = lint(path, text)
    blocks = python_blocks(text)
    if blocks:
        program = "\n\n".join(blocks)
        with tempfile.TemporaryDirectory() as tmp:
            try:
                r = subprocess.run(
                    [sys.executable, "-c", program],
                    input="",
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT_S,
                    cwd=tmp,
                )
                if r.returncode != 0:
                    errors.append("python failed:\n" + "\n".join(r.stderr.strip().splitlines()[-8:]))
            except subprocess.TimeoutExpired:
                errors.append(f"python timed out after {TIMEOUT_S}s")
    return path, errors


def main() -> int:
    if len(sys.argv) > 1:
        files = []
        for arg in sys.argv[1:]:
            p = CONTENT / arg
            files += sorted(p.rglob("*.md")) if p.is_dir() else [p]
    else:
        files = sorted(CONTENT.rglob("*.md"))
    files = [f for f in files if f.name != "NOTICE.md"]

    failed = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        for path, errors in pool.map(check, files):
            rel = path.relative_to(CONTENT)
            if errors:
                failed += 1
                print(f"FAIL {rel}")
                for e in errors:
                    print("   " + e.replace("\n", "\n   "))
            else:
                print(f"ok   {rel}")
    print(f"\n{len(files) - failed}/{len(files)} articles passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
