# CURSOR STRICT RULES - READ BEFORE EVERY TASK

## GOLDEN RULE
**NEVER deploy without testing. NEVER say DONE without verification.**

## MANDATORY CYCLE
1. Write code
2. Test locally (npm run dev)
3. Check browser (Chrome DevTools MCP)
4. IF errors → FIX and go to step 2
5. ONLY IF working → commit
6. Push
7. Wait deploy (2 min)
8. Check production (Chrome DevTools MCP)
9. IF errors → FIX and go to step 1
10. ONLY IF working → REPORT

## REQUIRED CHECKS

### After ANY change use Chrome DevTools MCP:
```javascript
open_url("http://localhost:3000/adminko/sources")
execute_javascript(`
({
  loaded: document.readyState === 'complete',
  title: document.title,
  hasNav: !!document.querySelector('nav'),
  hasTable: !!document.querySelector('table'),
  hasLoadingText: document.body.innerText.includes('Loading'),
  consoleErrors: window.__errors || [],
  failedRequests: performance.getEntriesByType('resource')
    .filter(r => r.responseStatus >= 400)
    .map(r => ({ url: r.name, status: r.responseStatus }))
})
`)
```

### SUCCESS CRITERIA (ALL must be TRUE):
- ✅ loaded === true
- ✅ title === "MediaSyndicate"
- ✅ hasNav === true
- ✅ hasTable === true
- ✅ hasLoadingText === FALSE (CRITICAL!)
- ✅ consoleErrors.length === 0
- ✅ failedRequests.length === 0

### IF ANY is FALSE:
- ❌ DO NOT COMMIT
- ❌ DO NOT DEPLOY
- ❌ FIX AND CHECK AGAIN

## PRODUCTION CHECK

After EVERY deploy:
```bash
sleep 120  # Wait for deploy
```

Then same checks on production:
```javascript
open_url("https://mediasyndicate.online/adminko/sources")
// Same execute_javascript checks
```

## REPORT FORMAT

Only after FULL verification of BOTH local AND production:

```
✅ VERIFICATION PASSED

Local Check:
- npm run dev: ✅ started in X seconds
- Page loaded: ✅
- Title: "MediaSyndicate"
- Nav: ✅
- Table: ✅
- Loading text: ❌ (GOOD - means no loading!)
- Console errors: 0
- Failed requests: 0

Production Check:
- URL: https://mediasyndicate.online/adminko/sources
- Page loaded: ✅
- Loading text: ❌ (GOOD!)
- API /api/admin/sources: ✅ 200
- Data displayed: ✅
- Functionality tested: ✅

READY TO USE
```

## COMMON ERRORS

### "Loading..." doesn't disappear
**CAUSE:** API not returning data
**FIX:**
1. Check console.log in useQuery
2. Test API: curl /api/admin/sources
3. Check credentials: 'include'

### Table not showing
**CAUSE:** No data or render error
**FIX:**
1. Check API returns array
2. Add console.log(data)
3. Check map() on undefined

## CONSEQUENCES

If you deploy without checking:
- ❌ Break production
- ❌ Waste Andy's time
- ❌ Waste Andy's money (tokens)
- ❌ Lose trust

**CHECK EVERYTHING. EVERY TIME. NO EXCEPTIONS.**
