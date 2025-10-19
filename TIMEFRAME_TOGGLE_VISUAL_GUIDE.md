# Timeframe Toggle - Visual Guide

## UI Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tracking History                             │
│                    Oct 8–14, 2025                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │  7D  │  30D  │  3M  │  Total  │                             │
│  └──────────────────────────────────────┘                      │
│      ▲                                                          │
│      └─ Timeframe Toggle (Segmented Control)                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │                   [Chart Area]                          │  │
│  │              📈 Line Graph Renders Here                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Button States

### Default State (Inactive)
```
┌─────────┐
│   7D    │  ← Light text (white 60% opacity)
└─────────┘  ← Transparent background
             ← Hover: white 90% opacity + slight bg
```

### Active State (Selected)
```
┌─────────┐
│   30D   │  ← Dark navy text (#1E2366)
└─────────┘  ← Yellow background (#EBFF3D)
             ← Bold font weight
             ← Subtle shadow
```

### Focus State (Keyboard Navigation)
```
┌─────────┐
│   3M    │  ← Yellow outline (2px)
└─────────┘  ← 2px offset from button
             ← Visible on Tab/Arrow key focus
```

## Responsive Layouts

### Desktop (≥640px)
```
Header: Tracking History                         Date: Oct 8–14, 2025
        
Toggle: [7D] [30D] [3M] [Total]  ← Inline, left-aligned
        
Chart:  ┌────────────────────────────────────────┐
        │                                        │
        │         Graph renders here             │
        │                                        │
        └────────────────────────────────────────┘
```

### Mobile (<640px)
```
Header: Tracking History
        Oct 8–14, 2025

Toggle: ┌──────────────────────────────┐
        │  [7D] [30D] [3M] [Total]    │  ← Full width
        └──────────────────────────────┘  ← Equal-sized buttons
        
Chart:  ┌──────────────────────────────┐
        │                              │
        │     Graph renders here       │
        │                              │
        └──────────────────────────────┘
```

## State Overlays

### Loading State
```
┌─────────────────────────────────────────┐
│                                         │
│              🔄 (spinning)              │  ← Animated spinner
│           Loading data...               │  ← Status text
│                                         │
└─────────────────────────────────────────┘
     ▲
     └─ Semi-transparent overlay
        (backdrop-filter: blur)
```

### Error State
```
┌─────────────────────────────────────────┐
│                                         │
│              ⚠️                         │  ← Error icon
│        Failed to load data              │  ← Error message
│                                         │
└─────────────────────────────────────────┘
```

### Insufficient Data Notice
```
┌─────────────────────────────────────────┐
│  ⚠️ Only 12 days of data available      │  ← Yellow notice banner
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│                                         │
│     [Chart renders with available       │
│      data, not blocking interaction]    │
│                                         │
└─────────────────────────────────────────┘
```

## Color Scheme

### Active Button
- **Background**: `#EBFF3D` (Primary Yellow)
- **Text**: `#1E2366` (Navy Dark)
- **Shadow**: `rgba(235, 255, 61, 0.3)`

### Inactive Button
- **Background**: Transparent / `rgba(255, 255, 255, 0.05)` on hover
- **Text**: `rgba(255, 255, 255, 0.6)` → `0.9` on hover

### Focus Indicator
- **Outline**: `#EBFF3D` 2px solid
- **Offset**: 2px

### Loading Spinner
- **Color**: `#EBFF3D` (Primary Yellow)
- **Border**: 4px with transparent top

### Notice Banner
- **Background**: `rgba(234, 179, 8, 0.1)` (Yellow 10%)
- **Border**: `rgba(234, 179, 8, 0.2)` (Yellow 20%)
- **Text**: `#fef08a` (Yellow 200)

## Interaction Flow

### Click Interaction
```
User clicks button
    ↓
Button receives active styling
    ↓
Date range calculated
    ↓
Console logs calculation steps
    ↓
Loading overlay appears
    ↓
Data fetched (500ms simulated delay)
    ↓
Chart updates (300ms animation)
    ↓
Date range text updates
    ↓
Loading overlay disappears
    ↓
Selection saved to sessionStorage
```

### Keyboard Interaction
```
Tab key focuses toggle
    ↓
Arrow keys navigate between buttons
    ↓
Visual focus indicator moves
    ↓
Enter/Space activates focused button
    ↓
[Same flow as click interaction]
```

## Animation Timing

```
Button Transition:  200ms ease
Chart Animation:    300ms easeInOutQuad
Loading Fade:       150ms ease-in-out
Hover Effect:       200ms ease
```

## Spacing & Sizing

### Button Dimensions
- **Padding**: `16px horizontal × 8px vertical`
- **Font Size**: `14px (0.875rem)`
- **Border Radius**: `6px (0.375rem)`
- **Gap between buttons**: `2px`

### Container
- **Toggle Container**:
  - `padding: 4px`
  - `border-radius: 8px`
  - `background: rgba(255,255,255,0.05)`
  - `border: 1px solid rgba(255,255,255,0.1)`

### Chart Area
- **Height**: `300px`
- **Padding**: `24px (1.5rem)` around card
- **Margin**: `16px (1rem)` below toggle

## Accessibility Labels

### Button ARIA Labels
```html
7D Button:    aria-label="Show last 7 days"
30D Button:   aria-label="Show last 30 days"
3M Button:    aria-label="Show last 3 months"
Total Button: aria-label="Show all time data"
```

### Container ARIA
```html
Toggle Container: role="tablist"
                  aria-label="Select timeframe for tracking history"

Each Button:      role="tab"
                  aria-pressed="true|false"
```

## Console Debug Output

When clicking a timeframe, you'll see:

```
[Timeframe] Selected: 30d
[Timeframe] End date (today): 2025-10-14T23:59:59.000Z
[Timeframe] Calculation: today - 29 days = 2025-09-15T00:00:00.000Z
[Timeframe] Final range: 2025-09-15T00:00:00.000Z to 2025-10-14T23:59:59.000Z
```

## CSS Class Reference

### Core Classes
```css
.timeframe-toggle        /* Container with border and padding */
.timeframe-btn           /* Individual button base styles */
.timeframe-btn.active    /* Selected button (yellow background) */
.timeframe-btn:hover     /* Hover state (lighter text) */
.timeframe-btn:focus     /* Focus state (yellow outline) */
.timeframe-btn:active    /* Click state (slight scale down) */
```

### State Classes
```css
.hidden                  /* Display: none for overlays */
.animate-spin           /* Rotation animation for spinner */
.chart-container        /* Relative positioning for overlays */
.chart-container.updating  /* Reduced opacity during update */
```

## Typical User Flow

```
1. User opens Dashboard
   └─→ 30D is selected by default
   └─→ Date range shows "Sep 15–Oct 14, 2025"
   └─→ Chart displays 30 days of data

2. User clicks "7D"
   └─→ Button turns yellow
   └─→ Loading spinner appears (500ms)
   └─→ Date range updates to "Oct 8–14, 2025"
   └─→ Chart animates to show 7 days (300ms)
   └─→ Selection saved to sessionStorage

3. User refreshes page
   └─→ 7D is still selected (persisted)
   └─→ Chart loads with 7-day view

4. User tabs to toggle (keyboard)
   └─→ First button (7D) receives focus
   └─→ Yellow outline appears
   
5. User presses Right Arrow
   └─→ Focus moves to 30D
   └─→ Outline follows focus

6. User presses Enter
   └─→ 30D becomes active
   └─→ Chart updates as in step 2
```

## Quick Visual Checklist

When reviewing the implementation, verify:

- [ ] Toggle appears above the chart
- [ ] One button has yellow background (active)
- [ ] Date range text is visible and formatted
- [ ] Buttons change appearance on hover
- [ ] Focus outline is visible when tabbing
- [ ] Loading spinner appears when switching
- [ ] Chart smoothly animates when updating
- [ ] Mobile layout stacks properly
- [ ] All text is readable (contrast check)
- [ ] Touch targets are adequate (44×44px min)

## Browser DevTools Inspection

### Elements Panel
```
<div role="tablist" class="timeframe-toggle">
  <button role="tab" 
          aria-pressed="false" 
          data-timeframe="7d"
          class="timeframe-btn">
    7D
  </button>
  <button role="tab" 
          aria-pressed="true" 
          data-timeframe="30d"
          class="timeframe-btn active">  ← Active button
    30D
  </button>
  ...
</div>
```

### Computed Styles (Active Button)
```
background-color: rgb(235, 255, 61)  /* #EBFF3D */
color: rgb(30, 35, 102)              /* #1E2366 */
font-weight: 600
box-shadow: 0 2px 8px rgba(235, 255, 61, 0.3)
```

---

## Quick Test Scenarios

### Visual Test
1. Open dashboard
2. Observe: 30D is highlighted in yellow
3. Hover over other buttons: slight highlight
4. Click 7D: button turns yellow immediately

### Keyboard Test
1. Press Tab until toggle is focused
2. Observe: yellow outline on first button
3. Press Arrow Right: focus moves, outline follows
4. Press Enter: button activates, chart updates

### Responsive Test
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Resize to 400px width
4. Observe: buttons stack/span full width

### Accessibility Test
1. Right-click toggle → Inspect
2. Check Elements panel for ARIA attributes
3. Verify role="tablist" and aria-labels
4. Test with screen reader if available

---

**Version**: 1.0  
**Created**: October 14, 2025  
**Purpose**: Visual reference for developers and QA
