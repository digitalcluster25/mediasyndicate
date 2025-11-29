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

## COLOR SCHEME RULES

**CRITICAL: Frontend design must use ONLY grayscale colors (slate palette).**

### Allowed Colors:
- ✅ **ONLY slate colors**: `slate-50`, `slate-100`, `slate-200`, `slate-300`, `slate-400`, `slate-500`, `slate-600`, `slate-700`, `slate-800`, `slate-900`, `slate-950`
- ✅ **White**: `white`, `bg-white`
- ✅ **Black**: `black`, `bg-black` (only for text or minimal accents)
- ✅ **Transparent**: `transparent`, `bg-transparent`

### Forbidden Colors:
- ❌ **NO orange** (`orange-*`)
- ❌ **NO red** (`red-*`)
- ❌ **NO yellow** (`yellow-*`)
- ❌ **NO green** (`green-*`)
- ❌ **NO blue** (`blue-*`)
- ❌ **NO purple** (`purple-*`)
- ❌ **NO pink** (`pink-*`)
- ❌ **NO other color palettes**

### Color Usage Guidelines:
- Use `slate-900` / `slate-950` for primary text
- Use `slate-600` / `slate-700` for secondary text
- Use `slate-400` / `slate-500` for muted/disabled text
- Use `slate-200` / `slate-300` for borders
- Use `slate-50` / `slate-100` for backgrounds
- Use `slate-500` / `slate-600` for accents and highlights
- Use different shades of slate to create visual hierarchy (darker = more important)

### Examples:
```tsx
// ✅ CORRECT
className="text-slate-900 bg-slate-50 border-slate-200"
className="text-slate-600 hover:text-slate-900"
className="bg-slate-500 text-white"

// ❌ WRONG
className="text-orange-600 bg-red-50"
className="text-blue-600 hover:text-green-600"
```

**ALL frontend components MUST follow this grayscale-only design system.**

## CONSEQUENCES

If you deploy without checking:
- ❌ Break production
- ❌ Waste Andy's time
- ❌ Waste Andy's money (tokens)
- ❌ Lose trust

**CHECK EVERYTHING. EVERY TIME. NO EXCEPTIONS.**
