# CURSOR: FIX "Loading..." PROBLEM - FOLLOW STRICT RULES

## PROBLEM
Production shows "Loading..." - data not loading!
https://mediasyndicate.online/adminko/sources

## YOUR MISSION
Fix the loading state and PROVE it works with testing.

## STRICT RULES TO FOLLOW

**READ docs/CURSOR-RULES.md FIRST!**

Then follow this cycle:

```
1. Find the problem (why Loading doesn't disappear)
2. Fix it
3. Test locally with Chrome DevTools MCP
4. Verify ALL criteria pass
5. ONLY THEN commit
6. Push
7. Wait 2 minutes
8. Test production with Chrome DevTools MCP  
9. Verify ALL criteria pass
10. ONLY THEN report
```

## DEBUGGING STEPS

### 1. Check the component
```typescript
// Find where "Loading..." is rendered
// app/adminko/sources/page.tsx or components/SourceTable.tsx
// Check useQuery hook
// Add console.log to see what's happening
```

### 2. Check API
```bash
curl https://mediasyndicate.online/api/admin/sources
# Should return JSON with sources
```

### 3. Check fetch
```typescript
// Verify credentials: 'include'
// Check error handling in useQuery
// Add .catch() logging
```

### 4. Check React Query setup
```typescript
// Verify QueryClientProvider
// Check defaultOptions
```

## TESTING CHECKLIST

### Before commit:
- [ ] npm run dev works
- [ ] Open http://localhost:3000/adminko/sources
- [ ] USE Chrome DevTools MCP to verify:
  ```javascript
  open_url("http://localhost:3000/adminko/sources")
  execute_javascript(`
    ({
      hasLoadingText: document.body.innerText.includes('Loading'),
      hasTable: !!document.querySelector('table'),
      consoleErrors: window.__errors || [],
      failedRequests: performance.getEntriesByType('resource')
        .filter(r => r.responseStatus >= 400)
    })
  `)
  ```
  - [ ] hasLoadingText === false
  - [ ] hasTable === true
  - [ ] consoleErrors.length === 0
  - [ ] failedRequests.length === 0

### After deploy:
- [ ] Wait 2 minutes (sleep 120)
- [ ] Open https://mediasyndicate.online/adminko/sources
- [ ] USE Chrome DevTools MCP to verify same checks
- [ ] hasLoadingText === false
- [ ] hasTable === true
- [ ] API returns data
- [ ] Table shows sources

## SUCCESS CRITERIA

```javascript
// Run this and ALL must be true:
{
  hasLoadingText: false,  // CRITICAL!
  hasTable: true,
  hasNav: true,
  sourcesCount: > 0,  // Should show 2 sources
  consoleErrors: 0,
  failedRequests: 0
}
```

## REPORT FORMAT

```
✅ LOADING FIXED

Problem was: [explain what was wrong]

Fixed by: [what you changed]

Local verification:
- Chrome DevTools MCP check:
  - hasLoadingText: false ✅
  - hasTable: true ✅
  - consoleErrors: 0 ✅
  - failedRequests: 0 ✅
- Table shows: 2 sources ✅

Production verification:
- Chrome DevTools MCP check:
  - hasLoadingText: false ✅
  - hasTable: true ✅
  - consoleErrors: 0 ✅
- API /api/admin/sources: returns data ✅
- Table shows: 2 sources ✅

TESTED AND WORKING
```

## START NOW

1. Read docs/CURSOR-RULES.md
2. Find the Loading problem
3. Fix it
4. TEST with Chrome DevTools MCP (both local AND production)
5. Only report when VERIFIED working

**DO NOT SKIP TESTING!**
**DO NOT SAY DONE WITHOUT CHROME DEVTOOLS MCP VERIFICATION!**
