#!/usr/bin/env python3
"""
remove_em_dashes.py
Removes em dash (—) characters from all TSX/HTML frontend files.

Rules:
  - " — " → " "        (word space emdash space word → single space)
  - " —"   → ""         (trailing emdash removes preceding space too)
  - "— "   → ""         (leading emdash removes following space too)
  - Double spaces →  single space (cleanup)
  - CTA special: "Start Free — 10-min Setup →" → "Start Free · 10-min Setup →"

Exclusions (lines skipped):
  - JS/JSX comments: // and *
  - Metadata title: lines containing `title:`
  - Metadata description: lines containing `description:`
  - Null placeholders: lines with ?? '—' or ?? "—"
  - Import statements
  - HTML entities in <title> tags
"""

import os
import re
import sys

DRY_RUN = '--dry-run' in sys.argv
APPLY   = '--apply'   in sys.argv

if not DRY_RUN and not APPLY:
    print("Usage: python3 remove_em_dashes.py --dry-run | --apply")
    sys.exit(1)

# ── Dirs / extensions to scan ────────────────────────────────────────────────
SEARCH_ROOTS = [
    '/Users/farabibinimran/dockpass/apps/web/app',
    '/Users/farabibinimran/dockpass/apps/web/components',
]
EXTENSIONS = {'.tsx', '.ts', '.html'}

# ── Dirs to skip outright ────────────────────────────────────────────────────
SKIP_DIRS = {'node_modules', '.next', 'dist', '.git', 'api'}

# ── Line-level exclusion patterns (skip the whole line) ──────────────────────
SKIP_LINE_RE = re.compile(
    r"""
    ^\s*//              # JS single-line comment
    | ^\s*\*            # JSDoc / block comment line
    | ^\s*\{?/\*        # JSX block comment: {/* or /*
    | \btitle\s*:       # metadata title (SEO preserved)
    | \bdescription\s*: # metadata description
    | \?\?\s*['"]—     # null-coalescing placeholder: ?? '—'
    | ^import\s         # import statement
    | <title>           # HTML title tag
    | CAPTAIN'S\s+LOG   # dateline design element
    | todayDate         # dateline date injection element
    | dl-dot            # dateline bullet
    """,
    re.VERBOSE,
)

# ── Special CTA substitution (before general rule) ────────────────────────────
CTA_RE = re.compile(r'Start Free\s*—\s*10-min Setup')
CTA_REPLACEMENT = 'Start Free · 10-min Setup'

# ── General em-dash rule ──────────────────────────────────────────────────────
# Matches optional whitespace, em-dash, optional whitespace → single space
EMDASH_RE = re.compile(r'\s*—\s*')

# ── Post-cleanup: collapse multiple spaces (but NOT inside strings/indentation)
DOUBLE_SPACE_RE = re.compile(r'(?<=\S)  +(?=\S)')  # only between non-whitespace chars

# ── Stats ─────────────────────────────────────────────────────────────────────
total_files_changed = 0
total_substitutions = 0
total_lines_skipped = 0


def process_file(filepath):
    global total_files_changed, total_substitutions, total_lines_skipped

    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        original_lines = f.readlines()

    new_lines = []
    file_changed = False
    file_subs = 0

    for lineno, line in enumerate(original_lines, start=1):
        # Skip excluded lines
        if SKIP_LINE_RE.search(line):
            new_lines.append(line)
            total_lines_skipped += 1
            continue

        # Only process lines that actually contain an em dash
        if '—' not in line:
            new_lines.append(line)
            continue

        modified = line

        # 1. CTA special case first
        modified, n_cta = CTA_RE.subn(CTA_REPLACEMENT, modified)
        file_subs += n_cta

        # 2. General em-dash removal (only if still has —)
        if '—' in modified:
            modified, n_em = EMDASH_RE.subn(' ', modified)
            file_subs += n_em

        # 3. Clean up double spaces between words
        modified = DOUBLE_SPACE_RE.sub(' ', modified)

        # 4. Clean up "  <" patterns (space before JSX tag) → " <"
        modified = re.sub(r'  <', ' <', modified)

        # 5. Clean trailing space before <br/> or other self-closing tags
        modified = re.sub(r' (<br\s*/>)', r'\1', modified)

        if modified != line:
            short = filepath.replace('/Users/farabibinimran/dockpass/', '')
            if DRY_RUN:
                print(f"\033[33m{short}:{lineno}\033[0m")
                print(f"  \033[31m- {line.rstrip()}\033[0m")
                print(f"  \033[32m+ {modified.rstrip()}\033[0m")
            file_changed = True

        new_lines.append(modified)

    if file_changed:
        total_files_changed += 1
        total_substitutions += file_subs
        if APPLY:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)

    return file_changed


def scan():
    for root in SEARCH_ROOTS:
        for dirpath, dirnames, filenames in os.walk(root):
            # Prune excluded dirs in-place
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fname in filenames:
                ext = os.path.splitext(fname)[1]
                if ext in EXTENSIONS:
                    process_file(os.path.join(dirpath, fname))


scan()

mode = "DRY RUN" if DRY_RUN else "APPLIED"
print(f"\n{'='*60}")
print(f"  Em Dash Removal — {mode}")
print(f"{'='*60}")
print(f"  Files changed     : {total_files_changed}")
print(f"  Em dashes removed : {total_substitutions}")
print(f"  Lines skipped     : {total_lines_skipped} (exclusions preserved)")
print(f"{'='*60}")
if DRY_RUN:
    print("  Run with --apply to write changes.")
else:
    print("  All changes written. Run: git diff to verify.")
