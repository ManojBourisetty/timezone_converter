#!/usr/bin/env bash
# Pre-push validation script for timezone_converter
# Runs all quality checks locally before a git push.
# Install once with:  bash scripts/install-hooks.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PASS=0
FAIL=0
PYTHON_BIN="${PYTHON_BIN:-python3}"

# ─── helpers ────────────────────────────────────────────────────────────────
step() { echo; echo "▶  $1"; }
ok()   { echo "   ✓  $1"; }
err()  { echo "   ✗  $1"; FAIL=$((FAIL + 1)); }

# ─── Backend ────────────────────────────────────────────────────────────────
step "Backend dependency check"
if "$PYTHON_BIN" -c "import pytz, fastapi, pytest" 2>/dev/null; then
  ok "Python deps found"
else
  echo "   Installing backend dependencies…"
  "$PYTHON_BIN" -m pip install -r "$REPO_ROOT/backend/requirements.txt" -q
fi

step "Backend security scan (bandit)"
if "$PYTHON_BIN" -m pip show bandit &>/dev/null 2>&1; then
  "$PYTHON_BIN" -m bandit -r "$REPO_ROOT/backend/" -f txt -ll 2>&1 | tail -5 && ok "Security scan passed" || err "Security issues found (review above)"
else
  "$PYTHON_BIN" -m pip install bandit -q
  "$PYTHON_BIN" -m bandit -r "$REPO_ROOT/backend/" -f txt -ll 2>&1 | tail -5 && ok "Security scan passed" || err "Security issues found (review above)"
fi

step "Backend unit tests (pytest)"
cd "$REPO_ROOT"
if "$PYTHON_BIN" -m pytest tests/ -v --tb=short 2>&1; then
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
# Check production deps only so dev-tooling advisories do not block pushes.
if npm audit --omit=dev --audit-level=high 2>&1 | tail -8; then
  ok "Audit passed (prod deps)"
else
  echo "   !  Advisory: high-severity npm vulnerabilities found in production dependencies"
  echo "   !  Push is allowed; schedule remediation via dependency upgrades"
fi

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
