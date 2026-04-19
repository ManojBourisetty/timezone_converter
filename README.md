# Timezone Converter

A modern multi-tool timezone productivity app with world clocks, manual conversion, global meeting planning, overlap intelligence, ICS calendar export, and shareable planner links.

Includes a dedicated landing homepage at `/` and the interactive timezone workspace at `/app`.

## Live URL

- Landing page: https://timezone-converter-ui.vercel.app/
- Workspace app: https://timezone-converter-ui.vercel.app/app

## What Is Included

- World clock dashboard for selected timezones
- Manual timezone conversion (from one timezone time to another)
- Meeting planner (date, host timezone, start time, duration)
- Best slots analyzer (cross-timezone overlap suggestions)
- ICS calendar export from meeting planner
- Shareable setup via URL parameters
- Shareable setup now preserves exact city identities for quick-city selections, not just raw UTC offsets
- Stylish landing homepage with animated globe/time motif, feature sections, and quick-start CTAs into app views
- Landing hero now includes a live multi-city clock strip so users see real-time timezone value before opening the workspace
- Team profiles with preferred timezone + working-hour windows
- Quick city shortcuts and favorites
- Quick city buttons now toggle selected cities on and off directly
- Quick city selection keeps the chooser stable while adding multiple cities
- Expanded quick city catalog with more North America, Europe, Asia, and Australia shortcuts
- Meeting app launch links (Google Meet/Calendar, Microsoft Teams, Zoom)
- Responsive cross-browser layout hardening (including iPad Safari)
- Browser local time banner now reflects the user's real device/browser timezone
- World clock city times are DST-aware for regional timezones like New York and London
- Top-level navigation refined into a clearer professional tabbed tool switcher
- Navigation stack stays sticky on scroll so tool switching remains reachable on longer pages
- Active tool panels use subtle transitions for smoother section changes
- Sticky navigation now adds pinned-state depth and live tab context badges for faster scanning
- Added a more polished visual layer with atmospheric background treatment, refined action buttons, and stronger section/card surfaces
- Quick City Access now promotes the exact clicked city instead of collapsing multiple same-offset cities into one generic selection
- Quick City Access can now add multiple city cards even when cities share the same UTC offset, so New York and Boston can appear side by side

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
- Shared links preserve city-specific selections like Boston and New York separately when both are chosen
- Without a shared link, each browser session stays independent

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
- Quick city access now toggles cities off directly instead of requiring removal from world clock cards.
- Quick city selection no longer jumps away while adding multiple cities from the shortcut grid.
- Fixed incorrect browser-local and regional world-clock time rendering by using timezone-aware display formatting.
- Refined page navigation for a cleaner professional tool-switching experience.
- Kept the local-time banner and tool navigation accessible during scroll with a sticky top stack.
- Added lighter motion and tighter header spacing so the interface feels more cohesive.
- Added live tab metadata so users can scan active zone counts, participant counts, target timezone context, and available overlap slots.
- Tightened card styling, section headers, and shortcut surfaces so the interface feels more cohesive without changing the underlying workflow.
- Fixed quick-city selection so cities like Miami and Toronto no longer implicitly resolve back to the default New York entry.
- Refined same-timezone city behavior so selecting another city in the same offset adds a distinct card instead of replacing the existing city card.
- Shareable links now restore exact city-based world clock selections instead of flattening them back to generic offset entries.

## User Data Scope

- The app is client-side and user state is stored in that user's browser, primarily through localStorage and the current URL.
- One user's changes are not shown to another user unless they are using the same browser profile on the same device or explicitly share a URL that contains planner state.
- Favorites and team profiles are browser-local, not shared across different users by default.

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
- Automatic scheduled re-run every hour (`cron: 17 * * * *`) to retry after quota windows reset
- Fallback deployment profile support (separate Vercel team/project)
- If primary quota is exhausted and fallback secrets are not configured, the workflow records a warning and exits successfully so CI is not blocked while scheduled retries continue
- Automatic trigger on changes under frontend and backend paths (plus workflow file changes)

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
