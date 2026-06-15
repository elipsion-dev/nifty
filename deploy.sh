#!/usr/bin/env bash
# One-step build + deploy for niftyutilities.com.
# Usage:  ./deploy.sh ["optional commit message"]
# Regenerates all pages, commits, and pushes. GitHub Pages redeploys automatically.
set -euo pipefail
cd "$(dirname "$0")"

echo "→ Building site..."
node generate-site.mjs

git add -A
if git diff --cached --quiet; then
  echo "✓ No changes to deploy."
  exit 0
fi

msg="${1:-Update site $(date '+%Y-%m-%d %H:%M')}"
git commit -q -m "$msg"
echo "→ Pushing..."
git push
echo "✓ Deployed: $msg"
echo "  GitHub Pages will redeploy in ~1 min: https://niftyutilities.com"
