#!/usr/bin/env bash
# Pre-push validation script for timezone_converter
# Runs all quality checks locally before a git push.
# Install once with:  bash scripts/install-hooks.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PASS=0
FAIL=0

# ─── helpers ────────────────────────────────────────────────────────────────
step() { echo; echo "▶  $1"; }
ok()   { echo "   ✓  $1"; }
err()  { echo "   ✗  $1"; FAIL=$((FAIL + 1)); }

# ─── Backend ────────────────────────────────────────────────────────────────
step "Backend dependency check"
if python3 -c "import pytz, fastapi, pytest" 2>/dev/null; then
  ok "Python deps found"
else
  echo "   Installing backend dependencies…"
  pip install -r "$REPO_ROOT/backend/requirements.txt" -q
fi

step "Backend security scan (bandit)"
if command -v bandit &>/dev/null || pip show bandit &>/dev/null 2>&1; then
  bandit -r "$REPO_ROOT/backend/" -f txt -ll 2>&1 | tail -5 && ok "Security scan passed" || err "Security issues found (review above)"
else
  pip install bandit -q
  bandit -r "$REPO_ROOT/backend/" -f txt -ll 2>&1 | tail -5 && ok "Security scan passed" || err "Security issues found (review above)"
fi

step "Backend unit tests (pytest)"
cd "$REPO_ROOT"
if python3 -m pytest tests/ -v --tb=short 2>&1; then
  ok "Backend tests passed"
else
  err "Backend tests FAILED — fix before pushing"
fi

# ─── Frontend ───────────────────────────────────────────────────────────────
step "Frontend dependency check"
if [ ! -d "$REPO_ROOT/frontend/node_modules" ]; then
  echo "   Installing frontend dependencies…"
  cd "$REPO_ROOT/frontend" && npm ci --silent
fi

step "Frontend security audit"
cd "$REPO_ROOT/frontend"
npm audit --audit-level=high 2>&1 | tail -8 && ok "Audit passed" || err "High-severity npm vulnerabilities found"

step "Frontend unit & functional tests (Jest)"
cd "$REPO_ROOT/frontend"
if npm test -- --watchAll=false --runInBand 2>&1; then
  ok "Frontend tests passed"
else
  err "Frontend tests FAILED — fix before pushing"
fi

# ─── Summary ────────────────────────────────────────────────────────────────
echo
echo "═══════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✓  All pre-push checks passed — pushing!"
  echo "═══════════════════════════════════════"
  exit 0
else
  echo "  ✗  $FAIL check(s) FAILED — push blocked."
  echo "     Fix the issues above, then push again."
  echo "═══════════════════════════════════════"
  exit 1
fi
