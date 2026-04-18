# ✅ Deployment Checklist & Guardrails

**Purpose**: Ensure every deployment is verified and matches code requirements

## Pre-Deployment Verification

### 1. Code Review (DO THIS FIRST)
- [ ] Check git diff with main branch: `git diff main`
- [ ] Verify no old/stale code is present: `grep -r "Select from\|ChevronDown" src/ --exclude-dir=ui`
- [ ] Confirm correct component imports: `grep "import.*Select\|ChevronDown" src/components/TimezoneConverter.jsx` (should return NOTHING)

### 2. Clean Build
```bash
# MANDATORY: Clear all build artifacts and cache
rm -rf .vercel build node_modules/.cache

# Fresh build
npm run build

# Verify build output for expected patterns
grep -i "autocomplete\|suggestions" build/static/js/main*.js
```

### 3. Content Verification
Before uploading to Vercel, verify the build contains NEW code:
```bash
# Should find "Type city name" (autocomplete version)
grep "Type city name" build/static/js/main*.js

# Should NOT find old patterns
grep "Select from" build/static/js/main*.js || echo "✅ No old code found"
```

## Deployment to Vercel

### 4. Deploy (Don't use --prebuilt on first deploy)
```bash
# First time: Let Vercel build fresh
cd frontend
npx vercel deploy --prod

# Subsequent: Clear cache first
rm -rf .vercel
npm run build
npx vercel deploy --prod --prebuilt
```

### 5. Post-Deployment Verification (CRITICAL)
```bash
# Check the deployed version contains NEW code
curl -s https://timezone-converter-ui.vercel.app | grep "Type city name" && echo "✅ AUTOCOMPLETE VERSION DEPLOYED"

# Verify old code is NOT present
curl -s https://timezone-converter-ui.vercel.app | grep -q "Select from" && echo "❌ OLD VERSION DEPLOYED - ROLLBACK!" || echo "✅ No old code present"
```

## Visual Verification Checklist

Once deployed, open browser and verify:
- [ ] "From Timezone" field has **input box** with search icon 🔍 (NO dropdown ▼)
- [ ] "To Timezone" field has **input box** with search icon 🔍 (NO dropdown ▼)
- [ ] Typing "new" shows suggestions **below** input (not a dropdown menu)
- [ ] Click suggestion → field clears and shows selected city below input
- [ ] Clear button (✕) appears when text is entered
- [ ] No Shadcn Select component visible
- [ ] Date picker works (Calendar icon)
- [ ] Time input field displays and works
- [ ] "Use Current Time" button works
- [ ] "Swap Timezones" button works
- [ ] "Convert Time" button works

## Common Mistakes to AVOID

❌ **DO NOT**: Use `--prebuilt` on first deployment  
❌ **DO NOT**: Skip cleaning `.vercel` directory  
❌ **DO NOT**: Skip post-deployment verification  
❌ **DO NOT**: Assume cached version is updated  
❌ **DO NOT**: Deploy without clearing `node_modules/.cache`

## Root Cause: Previous Failures

**Issue**: Dropdowns still showing after code was updated to autocomplete

**Root Cause**: 
- Old Vercel build cache in `.vercel/output/` with hash `874fc2f8`
- Current build in `build/` with hash `9e8aa7fa` (DIFFERENT)
- Vercel was serving stale cached version

**Solution**:
```bash
rm -rf .vercel build node_modules/.cache
npm run build
npx vercel deploy --prod
```

## Quick Deployment Script

Create `.deployrc.sh` in frontend directory:
```bash
#!/bin/bash
set -e

echo "🧹 Cleaning build artifacts..."
rm -rf .vercel build node_modules/.cache

echo "🔨 Building fresh..."
npm run build

echo "📦 Verifying build has new code..."
if ! grep -q "Type city name" build/static/js/main*.js; then
  echo "❌ ERROR: New code not found in build!"
  exit 1
fi

echo "📤 Deploying to Vercel..."
npx vercel deploy --prod --prebuilt

echo "✅ Waiting for deployment..."
sleep 10

echo "🔍 Verifying deployed version..."
if curl -s https://timezone-converter-ui.vercel.app | grep -q "Type city name"; then
  echo "✅ DEPLOYMENT SUCCESSFUL - Autocomplete version is live!"
else
  echo "❌ DEPLOYMENT FAILED - Old version still deployed"
  exit 1
fi
```

Usage: `chmod +x .deployrc.sh && ./. deployrc.sh`

## Verification Commands Reference

```bash
# Check code contains autocomplete
grep -n "TimezoneAutocomplete\|getFilteredTimezones" src/components/TimezoneConverter.jsx

# Check NO Select is imported
grep "import.*Select" src/components/TimezoneConverter.jsx

# Verify deployment
curl -s https://timezone-converter-ui.vercel.app | grep -o "Type city name"

# Check for old code patterns
curl -s https://timezone-converter-ui.vercel.app | grep "ChevronDown\|Select from" && echo "❌ Old code present" || echo "✅ Clean"
```

## Git Commit Standards

All commits touching UI/components must include:
```
Deploy verification:
- [ ] Build succeeds without errors
- [ ] New code present in build artifact
- [ ] Old code removed from build
- [ ] Deployed successfully
- [ ] Post-deployment verification passed
```

---

**Last Updated**: 2026-04-18  
**Critical**: Follow this checklist for EVERY deployment
