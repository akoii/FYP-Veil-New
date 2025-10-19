# Timeframe Toggle - Quick Reference

## Quick Start

The timeframe toggle is now live on the dashboard! Here's what you need to know:

## User Features

### Available Timeframes
- **7D**: Last 7 days (rolling)
- **30D**: Last 30 days (rolling) - DEFAULT
- **3M**: Last 3 months (calendar-based)
- **Total**: All available data

### How to Use
1. Navigate to Dashboard → Tracking History section
2. Click any timeframe button above the graph
3. Watch the graph update with new data range
4. Your selection persists for the current session

### Keyboard Shortcuts
- `Tab` - Focus the timeframe toggle
- `Arrow Keys` - Navigate between options
- `Enter` or `Space` - Select highlighted option

## Developer Reference

### Key Functions

```javascript
// Initialize the toggle (called on page load)
initializeTimeframeToggle()

// Handle user selection
handleTimeframeChange(selectedButton)

// Calculate date range for a timeframe
calculateDateRange(timeframe) // Returns {startDate, endDate}

// Update chart with new data
updateTrackingHistory(timeframe)

// Fetch data for date range
fetchTrackingData(startDate, endDate, timeframe)
```

### State Variables

```javascript
trackingChartInstance  // Chart.js instance
currentTimeframe       // Active timeframe ('7d'|'30d'|'3m'|'total')
TIMEFRAME_SESSION_KEY  // 'veil_tracking_timeframe'
```

### HTML Elements

```html
<!-- Timeframe buttons -->
<button data-timeframe="7d" class="timeframe-btn">7D</button>
<button data-timeframe="30d" class="timeframe-btn active">30D</button>
<button data-timeframe="3m" class="timeframe-btn">3M</button>
<button data-timeframe="total" class="timeframe-btn">Total</button>

<!-- Date range display -->
<p id="trackingDateRange">Oct 8–14, 2025</p>

<!-- State overlays -->
<div id="trackingChartLoading">...</div>
<div id="trackingChartError">...</div>
<div id="trackingChartNotice">...</div>
```

### CSS Classes

```css
.timeframe-toggle        /* Container for buttons */
.timeframe-btn          /* Individual button */
.timeframe-btn.active   /* Selected button */
.timeframe-btn:hover    /* Hover state */
.timeframe-btn:focus    /* Focus state */
```

## Date Calculation Examples

### Last 7 Days (7d)
```javascript
// Input: 2025-10-14
// Output: 2025-10-08 00:00:00 to 2025-10-14 23:59:59
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - 6);
```

### Last 30 Days (30d)
```javascript
// Input: 2025-10-14
// Output: 2025-09-15 00:00:00 to 2025-10-14 23:59:59
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - 29);
```

### Last 3 Months (3m)
```javascript
// Input: 2025-10-14
// Output: 2025-07-15 00:00:00 to 2025-10-14 23:59:59
const startDate = new Date(endDate);
startDate.setMonth(startDate.getMonth() - 3);
startDate.setDate(startDate.getDate() + 1);
```

### Total
```javascript
// Input: 2025-10-14
// Output: 2024-01-01 00:00:00 to 2025-10-14 23:59:59
const startDate = new Date(2024, 0, 1, 0, 0, 0, 0);
```

## Integration Guide

### 1. Connect Real Data Source

Replace the mock `fetchTrackingData()` function:

```javascript
async function fetchTrackingData(startDate, endDate, timeframe) {
  // Option A: Local Storage
  const data = await chrome.storage.local.get('trackingHistory');
  return filterByDateRange(data.trackingHistory, startDate, endDate);
  
  // Option B: Backend API
  const response = await fetch(`/api/tracking?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
  return await response.json();
}
```

### 2. Process Real Data

Transform your tracking events into chart data:

```javascript
function processTrackingData(events, startDate, endDate, timeframe) {
  const dayMap = new Map();
  
  // Group by day
  events.forEach(event => {
    const day = new Date(event.timestamp).toDateString();
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });
  
  // Generate labels and values
  const labels = [];
  const values = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const key = currentDate.toDateString();
    labels.push(formatLabel(currentDate, timeframe));
    values.push(dayMap.get(key) || 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { labels, values, actualDataPoints: labels.length, expectedDataPoints: labels.length };
}
```

### 3. Update KPIs

If you have summary metrics that should update:

```javascript
async function updateTrackingHistory(timeframe) {
  // ... existing code ...
  
  // Update KPIs
  updateTotalBlockedCount(data.values.reduce((a, b) => a + b, 0));
  updateWeeklyChange(calculateWeeklyChange(data.values));
}
```

## Testing Commands

### Manual Testing
```bash
# Start local server
cd "02_Extension_App/frontend/pages"
python -m http.server 8080

# Open browser
# Navigate to http://localhost:8080/dashboard.html
```

### Browser Console Tests
```javascript
// Test date calculation
calculateDateRange('7d')   // Should return 7-day range
calculateDateRange('30d')  // Should return 30-day range
calculateDateRange('3m')   // Should return 3-month range
calculateDateRange('total') // Should return all-time range

// Test chart update
updateTrackingHistory('7d')  // Should update to 7-day view

// Check current state
console.log(currentTimeframe)  // Current selection
sessionStorage.getItem('veil_tracking_timeframe')  // Persisted value
```

## Troubleshooting

### Chart Not Updating
```javascript
// Check if chart instance exists
console.log(trackingChartInstance);

// Verify Chart.js is loaded
console.log(typeof Chart);

// Check for errors
// Open DevTools → Console tab
```

### Wrong Date Calculation
```javascript
// Enable detailed logging (already in code)
// Check console output:
// [Timeframe] Selected: 30d
// [Timeframe] Calculation: today - 29 days = ...

// Verify timezone
console.log(new Date().getTimezoneOffset());
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
```

### Styling Issues
```css
/* Check if styles are loaded */
/* Open DevTools → Elements → Inspect .timeframe-btn */

/* Force reload CSS */
/* Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) */
```

## Performance Tips

### For Large Datasets (>365 days)
```javascript
// Option 1: Data sampling
function sampleData(data, maxPoints = 100) {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

// Option 2: Aggregation
function aggregateByWeek(dailyData) {
  // Group daily data into weekly buckets
}
```

### Reduce Animation Time
```javascript
// In chart options
animation: {
  duration: 150,  // Faster than default 300ms
  easing: 'linear'  // Simpler easing
}
```

## Files Modified

- `dashboard.html` - Added UI elements and overlays
- `dashboard.css` - Added timeframe toggle styles
- `dashboard.js` - Added all timeframe logic

## Next Steps

1. **Integrate real data**: Replace mock `fetchTrackingData()`
2. **Add analytics**: Track which timeframes users prefer
3. **Enhance visuals**: Add trend indicators (↑↓)
4. **Optimize performance**: Implement data caching strategy
5. **Add export**: Allow users to download data as CSV

## Questions?

Check the full implementation guide: `TIMEFRAME_TOGGLE_IMPLEMENTATION.md`

---
**Version**: 1.0 | **Updated**: Oct 14, 2025
