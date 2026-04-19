# Copilot Instructions — timezone_converter

These instructions apply to every Copilot interaction in this repository.
Read and follow them before implementing any change.

---

## Test-Generation Skill (MANDATORY for every new feature)

Whenever a new component, function, API endpoint, or UI behaviour is added or
modified, you MUST generate tests that cover it **before committing**.

### Trigger conditions
- New React component or hook added
- Existing component updated with new props, state, or UI behaviour
- New backend endpoint or service method added
- Bug fix that should not regress

---

### Frontend test requirements (Jest + React Testing Library)

**File:** `frontend/src/components/<ComponentName>.test.js`
(or append to an existing test file for the same component)

Every feature must have tests in **all three categories**:

#### 1. Unit tests — static / render checks
```
test('renders <element> with correct text/label', ...)
test('renders <element> in DOM', ...)
```

#### 2. Functional tests — user interaction
```
test('opens/closes on click', ...)
test('filters/selects/submits correctly', ...)
test('calls correct API with correct payload', ...)
```

#### 3. Regression tests — error & edge cases
```
test('handles empty state gracefully', ...)
test('handles API error without crashing', ...)
test('clears state when dialog closed and reopened', ...)
```

**Patterns to follow (copy from existing tests):**
- Mock `axios` with `jest.mock('axios')`
- Use `beforeEach` to set up `axios.get.mockImplementation(...)` with realistic data
- Use `waitFor(...)` for async state changes
- Use `data-testid` attributes to locate elements (`screen.getByTestId(...)`)
- Every new clickable element that a user would interact with needs a `data-testid`
- Never use implementation details (internal state, refs) — test behaviour only

**Minimum coverage for a new dialog/modal:**
- [ ] "Browse / Open" trigger renders
- [ ] Dialog opens on trigger click with correct title
- [ ] Dialog content loads and displays correctly
- [ ] Search/filter works and shows results
- [ ] Search/filter shows empty state for no matches
- [ ] Selecting an item closes the dialog and updates parent state
- [ ] Close button closes dialog
- [ ] State (search term, selection) resets on close + reopen

---

### Backend test requirements (pytest)

**File:** `tests/test_<feature>.py`

Every new endpoint or service method needs:
```python
def test_<feature>_basic(service):         # happy path
def test_<feature>_invalid_input(service): # validation / error
def test_<feature>_edge_case(service):     # empty / boundary
```

Follow patterns in `tests/test_timezone.py`.

---

### Before every commit checklist

Run these locally and fix all failures:

```bash
# Frontend tests
cd frontend && npm test -- --watchAll=false --runInBand

# Backend tests
python -m pytest tests/ -v

# Security
bandit -r backend/ -f txt -ll
cd frontend && npm audit --audit-level=high
```

Or run all at once (pre-push hook): `bash scripts/pre-push.sh`

---

## Architecture conventions

- **Frontend:** React 18, CRA (react-scripts 5), Tailwind CSS, Radix UI, Axios
- **Backend:** FastAPI, pytz, Pydantic v1, Python 3.9+
- **Deploy:** Vercel (frontend) — auto-deploys on push to `main`
- **CI/CD:** GitHub Actions — 3 workflows:
  - `deploy-vercel.yml` — push to main: backend tests + frontend tests + build + deploy
  - `ci-cd.yml` — PRs: full validation (bandit, pytest, eslint, build)
  - `pr-tests.yml` — PRs: frontend tests only
- **No database** — all timezone logic is stateless

## Coding conventions

- New UI strings go in component JSX — no i18n layer needed now
- `data-testid` attributes are **required** on all interactive elements (buttons, inputs, result containers)
- Wrap all async side-effect functions with `useCallback` and declare their dependencies
- Never use bare `except Exception` in Python — catch specific exception types
- Backend host must stay `127.0.0.1` (not `0.0.0.0`) for security

## Security rules (always enforce)

- No hardcoded tokens, keys, or passwords anywhere
- CORS origins must be explicit (no `*` wildcard) in `backend/server.py`
- Dependency versions must be pinned in `requirements.txt` and `package.json`
- Run `bandit` and `npm audit` and fix all high/critical findings before merging
