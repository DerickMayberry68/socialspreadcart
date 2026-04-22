#!/usr/bin/env bash
# Vercel "Ignored Build Step" hook.
#
# Configured in the Vercel dashboard:
#   Project → Settings → Git → Ignored Build Step
#     Command: `bash scripts/vercel-ignore-build.sh`
#
# Contract with Vercel:
#   exit 0  => SKIP this build
#   exit 1  => PROCEED with this build
#
# Goal: don't burn build minutes on pushes that only touch docs, specs,
# agent/skill metadata, or other non-bundle files — none of those can
# change the deployed output.

set -euo pipefail

# First commit on a branch has no parent; always build it so we don't
# ship a stale preview.
if ! git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  echo "No parent commit for HEAD — building."
  exit 1
fi

CHANGED=$(git diff --name-only HEAD^ HEAD)

# Paths whose changes never affect the deployed bundle.
# Anything not matching this pattern is treated as "real" and forces a build.
SKIP_PATTERN='^(specs|\.claude|\.agents|\.cursor|\.github/ISSUE_TEMPLATE)/|^(AGENTS|CLAUDE|README)\.md$'

if echo "$CHANGED" | grep -qvE "$SKIP_PATTERN"; then
  echo "Code or config changes detected — building."
  echo "Changed files:"
  echo "$CHANGED" | sed 's/^/  /'
  exit 1
else
  echo "Only docs / specs / agent metadata changed — skipping build."
  echo "Skipped files:"
  echo "$CHANGED" | sed 's/^/  /'
  exit 0
fi
