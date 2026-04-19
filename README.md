# Timezone Converter

A modern multi-tool timezone productivity app with world clocks, manual conversion, global meeting planning, overlap intelligence, ICS calendar export, and shareable planner links.

## Live URL

- App: https://timezone-converter-ui.vercel.app

## What Is Included

- World clock dashboard for selected timezones
- Manual timezone conversion (from one timezone time to another)
- Meeting planner (date, host timezone, start time, duration)
- Best slots analyzer (cross-timezone overlap suggestions)
- ICS calendar export from meeting planner
- Shareable setup via URL parameters
- Team profiles with preferred timezone + working-hour windows
- Quick city shortcuts and favorites
- Meeting app launch links (Google Meet/Calendar, Microsoft Teams, Zoom)
- Responsive cross-browser layout hardening (including iPad Safari)

## Feature Highlights

### 1) World Clock

- Real-time clock cards for selected timezones
- Per-card copy actions for time/date
- Favorites and quick re-add

### 2) Manual Converter

- Input source timezone + time
- Convert to target timezone with date-shift awareness
- Copy converted result

### 3) Meeting Planner

- Host timezone, date, time, and duration
- Quick duration presets and "start in 30 minutes" shortcut
- Per-timezone meeting ranges
- Work-hours fitness badges
- Copy meeting summary
- Direct launch actions for Google, Teams, and Zoom scheduling flows

### 4) Best Slot Intelligence

- Suggests UTC slots where all participants are in work hours
- Shows local-time ranges for each selected timezone

### 5) ICS Calendar Export

- Exports `.ics` invite from planner state
- Uses UTC start/end in generated event

### 6) Shareable Planner Link

- Planner state is mirrored in URL query params
- Opening a link restores current planning setup

### 7) Team Profiles

- Store members with preferred timezone and work-hour windows
- Persisted in browser localStorage
- One-click apply team timezones to planner
- Advanced profile management is tucked behind a toggle for a cleaner default planner UX

## Feature Update Documentation Policy

- Any feature addition, behavior change, or UX change must include a README update in the same commit/PR.
- Update at least two places when relevant:
  - `What Is Included` for high-level capability changes
  - `Feature Highlights` for detailed behavior changes
- If deployment, configuration, or secrets are affected, update deployment sections in the same change.
- If tests are added or updated for a feature, keep the README testing guidance aligned.

## Recent Feature Updates

- Meeting planner UX simplified with faster defaults and shortcuts.
- Google/Teams/Zoom meeting launch links added from planner context.
- Team profile management moved behind an advanced toggle to reduce UI complexity for first-time use.
- Improved responsive behavior to prevent field overlap/disorientation on tablet and Safari browsers.

## Tech Stack

### Frontend

- React 19
- Tailwind CSS
- shadcn/ui primitives (trimmed to only used components)
- Lucide React

### Backend

- FastAPI (retained in repo)
- Pytest and Bandit checks in CI

## Repository Organization

The frontend has been cleaned and simplified to keep only active code paths.

Key paths:

- `frontend/src/components/TimezoneConverter.jsx` - main app feature surface
- `frontend/src/components/TimezoneConverter.test.js` - frontend test coverage
- `frontend/src/data/timezoneData.js` - hardcoded timezone/city data used by frontend
- `frontend/src/components/ui/` - only currently used UI primitives retained

## Local Development

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend (optional for current UI flow)

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m pytest tests/ -v
```

## Testing

```bash
cd frontend
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

## Security Audit Notes

- Runtime production dependency audit can be checked with:

```bash
cd frontend
npm audit --omit=dev
```

- Build-time tooling from Create React App (`react-scripts`) still reports known advisories in full-scope audit (`npm audit`) due upstream maintenance status.
- These advisories are in development/build dependencies, not in shipped browser runtime dependencies.

## Notes About Deployment

- CI builds/tests pass for this repository.
- If Vercel deployment fails with quota messages like
  `api-deployments-young-hobby-team-24h`, this is an account/team deployment limit, not an application build failure.

### Workflow Resilience (New)

The deploy workflow now includes:

- Quota-aware retry logic for Vercel deploy attempts
- Automatic scheduled re-run every 4 hours (`cron: 17 */4 * * *`) to retry after quota windows reset
- Fallback deployment profile support (separate Vercel team/project)
- If primary quota is exhausted and fallback secrets are not configured, the workflow records a warning and exits successfully so CI is not blocked while scheduled retries continue

### Configure Fallback Deployment Profile

Add these GitHub repository secrets to enable fallback target deployment:

- `VERCEL_FALLBACK_TOKEN`
- `VERCEL_FALLBACK_ORG_ID`
- `VERCEL_FALLBACK_PROJECT_ID`

Primary profile still uses:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Author

ManojBourisetty
