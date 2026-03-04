# Countdown Timer Simplified - Minutes Only

**Date:** 2026-02-22  
**Status:** ✅ COMPLETE

## Change

Simplified countdown timer to **only show minutes** (no hours conversion).

### Before (Complex)

| Time | Display |
|------|---------|
| 45 seconds | `45 seconds left` |
| 3 min 25 sec | `3 min 25 sec left` |
| 18 minutes | `18 minutes left` |
| 60 minutes | `1 hour left` ❌ |
| 90 minutes | `1 hour 30 min left` ❌ |

### After (Simple)

| Time | Display |
|------|---------|
| 45 seconds | `45 sec left` |
| 3 min 25 sec | `3 min 25 sec left` |
| 18 minutes | `18 min left` |
| 60 minutes | `60 min left` ✅ |
| 90 minutes | `90 min left` ✅ |

## Why This is Better

### 1. Consistency
- Always shows time in same unit (minutes)
- No mental conversion needed (1 hour 30 min = 90 min)

### 2. Simpler
- Fewer words: "18 min left" vs "18 minutes left"
- No hour calculations needed

### 3. Clearer for HOT Jobs
- Live feed jobs expire in 30 minutes max
- No job will show hours anyway (30 min window)
- Minutes-only makes sense for short timeframes

## New Format Rules

```javascript
< 1 minute    → "45 sec left"
1-4 minutes   → "3 min 25 sec left"  (shows seconds for urgency)
5+ minutes    → "18 min left"         (minutes only, cleaner)
```

## Examples

### Critical Urgency (Red, 0-10 min)
```
⚠️ 30 sec left
⚠️ 2 min 45 sec left
⚠️ 8 min left
```

### High Urgency (Orange, 10-20 min)
```
12 min left
18 min left
```

### Normal (Green, 20-30 min)
```
22 min left
28 min left
```

## Code Change

**Old:**
```javascript
// 5-59 minutes (hide seconds)
if (minutes < 60) {
  return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
}

// 1+ hours (complex conversion)
const hours = Math.floor(minutes / 60);
const remainingMins = minutes % 60;
return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMins} min left`;
```

**New:**
```javascript
// 5+ minutes - show minutes only (simple!)
return `${minutes} min left`;
```

**Lines of code:** 15 → 5 (67% reduction)

## Files Changed

1. `src/components/LiveFeedCard.js`
   - Simplified `formatTimeRemaining()` function
   - Removed hour conversion logic
   - Shortened "minutes" to "min"
   - Shortened "seconds" to "sec"

## Testing

Visit http://localhost:3000/opportunities and check Live Feed timers:

**Expected:**
- ✅ All times show as minutes (no hours)
- ✅ "18 min left" (not "18 minutes left")
- ✅ "45 sec left" (not "45 seconds left")
- ✅ Under 5 mins shows seconds: "3 min 25 sec left"

## Status

**LIVE** ✅ (compiled successfully)

Refresh http://localhost:3000/opportunities to see simplified timers!
