# Timeframe Toggle - Testing Checklist

## Pre-Testing Setup

- [ ] Local server running on port 8080
- [ ] Dashboard accessible at http://localhost:8080/dashboard.html
- [ ] Browser DevTools opened (F12)
- [ ] Console tab visible for debug logs

---

## Functional Tests

### Basic Selection Tests

- [ ] **Test 1.1**: Default selection on first load
  - Action: Open dashboard for first time
  - Expected: "30D" button has yellow background and bold text
  - Expected: Date range shows approximately 30 days ending today
  
- [ ] **Test 1.2**: Select 7D timeframe
  - Action: Click "7D" button
  - Expected: Button turns yellow
  - Expected: Chart updates to show 7 days
  - Expected: Date range shows 7 days (e.g., "Oct 8–14, 2025")
  - Expected: Loading spinner appears briefly
  
- [ ] **Test 1.3**: Select 30D timeframe
  - Action: Click "30D" button
  - Expected: Button turns yellow
  - Expected: Chart updates to show 30 days
  - Expected: Date range shows 30 days
  
- [ ] **Test 1.4**: Select 3M timeframe
  - Action: Click "3M" button
  - Expected: Button turns yellow
  - Expected: Chart updates to show ~90 days
  - Expected: Date range shows 3 months (e.g., "Jul 15–Oct 14, 2025")
  
- [ ] **Test 1.5**: Select Total timeframe
  - Action: Click "Total" button
  - Expected: Button turns yellow
  - Expected: Chart updates to show all-time data
  - Expected: Date range shows full period from earliest date

### State Management Tests

- [ ] **Test 2.1**: Only one button active at a time
  - Action: Click through all buttons
  - Expected: Only the clicked button has yellow background
  - Expected: Previous selection returns to inactive state
  
- [ ] **Test 2.2**: Session persistence
  - Action: Select "7D", then refresh page (F5)
  - Expected: "7D" is still selected after refresh
  - Expected: Chart shows 7-day data
  
- [ ] **Test 2.3**: No action on re-selecting active button
  - Action: Click currently active button again
  - Expected: No loading spinner
  - Expected: No chart flicker
  - Expected: Button remains active

### Data Fetching Tests

- [ ] **Test 3.1**: Loading state appears
  - Action: Click any non-active button
  - Expected: Loading spinner overlay appears
  - Expected: "Loading data..." text visible
  - Expected: Spinner animates (rotates)
  
- [ ] **Test 3.2**: Loading state disappears
  - Action: Wait after clicking button
  - Expected: Loading overlay disappears after ~500ms
  - Expected: Chart is visible again
  
- [ ] **Test 3.3**: Chart updates smoothly
  - Action: Switch between timeframes
  - Expected: Chart animates transition (~300ms)
  - Expected: No jank or flicker
  - Expected: Y-axis scales appropriately

### Date Calculation Tests

- [ ] **Test 4.1**: 7D date range is correct
  - Action: Select "7D" and check date range text
  - Expected: Ends with today's date
  - Expected: Starts 6 days before today
  - Expected: Console shows correct calculation
  
- [ ] **Test 4.2**: 30D date range is correct
  - Action: Select "30D" and check date range text
  - Expected: Ends with today's date
  - Expected: Starts 29 days before today
  
- [ ] **Test 4.3**: 3M date range is calendar-based
  - Action: Select "3M" and check date range text
  - Expected: Ends with today's date
  - Expected: Starts ~3 months ago (calendar months, not 90 days)
  - Expected: Console shows month calculation
  
- [ ] **Test 4.4**: Console logging is detailed
  - Action: Select any timeframe and check console
  - Expected: See "[Timeframe] Selected: ..." log
  - Expected: See calculation steps logged
  - Expected: See final ISO date range logged

---

## Accessibility Tests

### Keyboard Navigation Tests

- [ ] **Test 5.1**: Tab to focus toggle
  - Action: Press Tab key from page top
  - Expected: First timeframe button receives focus
  - Expected: Yellow outline (2px) is visible
  
- [ ] **Test 5.2**: Arrow Right navigation
  - Action: Focus on first button, press Arrow Right
  - Expected: Focus moves to next button
  - Expected: Outline follows focus
  
- [ ] **Test 5.3**: Arrow Left navigation
  - Action: Focus on last button, press Arrow Left
  - Expected: Focus moves to previous button
  - Expected: Outline follows focus
  
- [ ] **Test 5.4**: Arrow key wrapping
  - Action: On last button, press Arrow Right
  - Expected: Focus wraps to first button
  - Action: On first button, press Arrow Left
  - Expected: Focus wraps to last button
  
- [ ] **Test 5.5**: Arrow Down/Up work same as Right/Left
  - Action: Press Arrow Down when focused
  - Expected: Same behavior as Arrow Right
  - Action: Press Arrow Up when focused
  - Expected: Same behavior as Arrow Left
  
- [ ] **Test 5.6**: Enter key activates button
  - Action: Focus on non-active button, press Enter
  - Expected: Button becomes active
  - Expected: Chart updates
  
- [ ] **Test 5.7**: Space key activates button
  - Action: Focus on non-active button, press Space
  - Expected: Button becomes active
  - Expected: Chart updates

### ARIA Attributes Tests

- [ ] **Test 6.1**: Container has tablist role
  - Action: Inspect toggle container in DevTools
  - Expected: `role="tablist"` present
  - Expected: `aria-label="Select timeframe for tracking history"` present
  
- [ ] **Test 6.2**: Buttons have tab role
  - Action: Inspect individual buttons
  - Expected: `role="tab"` present on each
  
- [ ] **Test 6.3**: aria-pressed reflects state
  - Action: Check active button
  - Expected: `aria-pressed="true"` on active button
  - Expected: `aria-pressed="false"` on inactive buttons
  
- [ ] **Test 6.4**: aria-label is descriptive
  - Action: Inspect each button
  - Expected: "Show last 7 days" on 7D button
  - Expected: "Show last 30 days" on 30D button
  - Expected: "Show last 3 months" on 3M button
  - Expected: "Show all time data" on Total button

### Focus Indicators Tests

- [ ] **Test 7.1**: Focus outline is visible
  - Action: Tab to focus any button
  - Expected: 2px solid yellow outline
  - Expected: 2px offset from button edge
  - Expected: Outline doesn't overflow container
  
- [ ] **Test 7.2**: Focus indicator moves with navigation
  - Action: Use Arrow keys to navigate
  - Expected: Outline smoothly follows focus
  - Expected: Outline is always visible

### Color Contrast Tests

- [ ] **Test 8.1**: Active button contrast (WCAG AAA)
  - Visual: Yellow text (#EBFF3D) on navy background (#1E2366)
  - Expected: High contrast, easily readable
  - Tool check: Contrast ratio ≥ 7:1 (AAA)
  
- [ ] **Test 8.2**: Inactive button contrast (WCAG AA)
  - Visual: White text (60% opacity) on dark background
  - Expected: Readable but visually distinct from active
  - Tool check: Contrast ratio ≥ 4.5:1 (AA)
  
- [ ] **Test 8.3**: Focus outline contrast
  - Visual: Yellow outline (#EBFF3D) on background
  - Expected: Clearly visible in all states

### Screen Reader Tests (Optional)

- [ ] **Test 9.1**: Button labels are announced
  - Tool: Use screen reader (NVDA/JAWS/VoiceOver)
  - Expected: Hears full aria-label when focused
  
- [ ] **Test 9.2**: State changes are announced
  - Action: Activate a button with screen reader
  - Expected: Hears "pressed" state change
  
- [ ] **Test 9.3**: Container context is announced
  - Action: Tab to toggle with screen reader
  - Expected: Hears "Select timeframe for tracking history"

---

## Responsive Design Tests

### Desktop Tests (≥640px)

- [ ] **Test 10.1**: Layout is horizontal
  - Viewport: 1920×1080 (desktop)
  - Expected: Buttons side-by-side in a row
  - Expected: Toggle is left-aligned
  - Expected: Toggle doesn't span full width
  
- [ ] **Test 10.2**: Hover states work
  - Action: Hover over inactive buttons
  - Expected: Text lightens to 90% opacity
  - Expected: Subtle background highlight
  
- [ ] **Test 10.3**: Chart is full width
  - Expected: Chart fills available container width
  - Expected: 300px height maintained

### Tablet Tests (640-1024px)

- [ ] **Test 11.1**: Layout adapts gracefully
  - Viewport: 768×1024 (iPad)
  - Expected: Buttons remain horizontal
  - Expected: Adequate spacing maintained
  - Expected: No overflow or clipping

### Mobile Tests (<640px)

- [ ] **Test 12.1**: Full-width toggle
  - Viewport: 375×667 (iPhone)
  - Expected: Toggle spans full container width
  - Expected: Buttons have equal width (flex: 1)
  
- [ ] **Test 12.2**: Touch targets are adequate
  - Expected: Buttons are at least 44×44px
  - Expected: Easy to tap without mis-taps
  
- [ ] **Test 12.3**: Text remains readable
  - Expected: Button text (7D, 30D, etc.) is clear
  - Expected: Date range text is readable
  - Expected: No text overlap or truncation
  
- [ ] **Test 12.4**: Vertical stacking
  - Expected: Title and date range may stack vertically
  - Expected: Toggle is below header, above chart
  
- [ ] **Test 12.5**: No horizontal scroll
  - Expected: Page doesn't overflow horizontally
  - Expected: All content fits in viewport

### Small Mobile Tests (<375px)

- [ ] **Test 13.1**: Ultra-small screens
  - Viewport: 320×568 (iPhone SE)
  - Expected: Layout still functional
  - Expected: Buttons may have smaller padding but remain tappable

---

## Edge Case Tests

### Insufficient Data Tests

- [ ] **Test 14.1**: Notice banner appears (if implemented)
  - Action: Select timeframe with partial data
  - Expected: Yellow notice banner above chart
  - Expected: Message like "Only 12 days of data available"
  - Expected: Chart still renders with available data
  
- [ ] **Test 14.2**: Notice is non-blocking
  - Expected: User can still interact with chart
  - Expected: Notice doesn't cover controls

### Error State Tests

- [ ] **Test 15.1**: Error overlay displays (if error occurs)
  - Expected: Red/warning icon visible
  - Expected: Error message displayed
  - Expected: Chart area is covered by error overlay

### Rapid Clicking Tests

- [ ] **Test 16.1**: Rapid button clicking
  - Action: Quickly click different buttons multiple times
  - Expected: No errors in console
  - Expected: Chart updates correctly to final selection
  - Expected: Only one loading animation at a time
  
- [ ] **Test 16.2**: Click same button repeatedly
  - Action: Click active button multiple times
  - Expected: No action taken (as designed)
  - Expected: No unnecessary network calls
  - Expected: No visual glitches

### Browser Refresh Tests

- [ ] **Test 17.1**: Persistence across refresh
  - Action: Select any timeframe, refresh page (F5)
  - Expected: Same timeframe still selected
  - Expected: Chart loads with same data range
  
- [ ] **Test 17.2**: Hard refresh clears cache
  - Action: Select timeframe, hard refresh (Ctrl+Shift+R)
  - Expected: Session storage may persist
  - Expected: No visual errors on reload

---

## Performance Tests

### Load Time Tests

- [ ] **Test 18.1**: Initial page load
  - Expected: Chart appears within 1 second
  - Expected: Default (30D) data loads smoothly
  
- [ ] **Test 18.2**: Timeframe switch speed
  - Action: Click different timeframe
  - Expected: Loading overlay appears immediately
  - Expected: Chart updates within 1 second (500ms fetch + 300ms animation)

### Animation Smoothness Tests

- [ ] **Test 19.1**: Chart animation is smooth
  - Action: Switch timeframes while watching chart
  - Expected: 60 fps animation (no dropped frames)
  - Expected: Smooth easing (easeInOutQuad)
  - Expected: No jank or stuttering
  
- [ ] **Test 19.2**: Button transitions are smooth
  - Action: Click buttons and observe state change
  - Expected: Background color transitions smoothly (200ms)
  - Expected: No flash of unstyled content

### Memory Tests

- [ ] **Test 20.1**: No memory leaks
  - Action: Switch timeframes 20+ times
  - Expected: No console errors
  - Expected: Memory usage doesn't grow excessively (check DevTools Memory tab)

---

## Console Output Tests

### Debug Logging Tests

- [ ] **Test 21.1**: Selection logging
  - Action: Click "7D"
  - Expected: See "[Timeframe] Selected: 7d" in console
  
- [ ] **Test 21.2**: Date calculation logging
  - Expected: See end date (today) logged
  - Expected: See calculation formula logged
  - Expected: See final date range logged
  
- [ ] **Test 21.3**: ISO format dates
  - Expected: Dates logged in ISO 8601 format
  - Expected: Timezone information included

### Error Logging Tests

- [ ] **Test 22.1**: No JavaScript errors
  - Action: Perform all actions above
  - Expected: No errors in console (red messages)
  - Expected: No warnings about missing elements
  
- [ ] **Test 22.2**: Chart.js is loaded
  - Action: Type `typeof Chart` in console
  - Expected: Returns "function"

---

## Browser Compatibility Tests

### Chrome Tests

- [ ] **Test 23.1**: Chrome 118+
  - Expected: All features work
  - Expected: Smooth animations
  
- [ ] **Test 23.2**: Chrome mobile (Android)
  - Expected: Touch interactions work
  - Expected: Responsive layout activates

### Edge Tests (Optional)

- [ ] **Test 24.1**: Edge 118+
  - Expected: Same behavior as Chrome

### Firefox Tests (Optional)

- [ ] **Test 25.1**: Firefox 119+
  - Expected: All features work
  - Expected: Focus indicators may look slightly different

---

## Integration Tests

### With Existing Dashboard Tests

- [ ] **Test 26.1**: Other dashboard features still work
  - Expected: Privacy score displays correctly
  - Expected: Score breakdown chart works
  - Expected: Sidebar navigation functions
  - Expected: Cookie management section works
  
- [ ] **Test 26.2**: No conflicts with other scripts
  - Expected: No console errors from other modules
  - Expected: All event listeners work correctly

---

## Visual Regression Tests

### Before/After Comparison

- [ ] **Test 27.1**: Tracking History section enhanced
  - Expected: Toggle appears above chart
  - Expected: Date range appears below title
  - Expected: Chart area remains same height (300px)
  
- [ ] **Test 27.2**: No unintended style changes
  - Expected: Other sections remain unchanged
  - Expected: Color scheme consistent throughout
  - Expected: Spacing and alignment preserved

---

## Documentation Tests

### Code Documentation

- [ ] **Test 28.1**: Inline comments are clear
  - Review: dashboard.js comments
  - Expected: Each function has purpose comment
  - Expected: Complex logic is explained
  
- [ ] **Test 28.2**: Variable names are semantic
  - Review: Variable declarations
  - Expected: Names clearly indicate purpose
  - Expected: No single-letter or cryptic names (except loop counters)

### External Documentation

- [ ] **Test 29.1**: Implementation guide exists
  - File: TIMEFRAME_TOGGLE_IMPLEMENTATION.md
  - Expected: Comprehensive technical details
  
- [ ] **Test 29.2**: Quick reference exists
  - File: TIMEFRAME_TOGGLE_QUICKSTART.md
  - Expected: Developer quick start guide
  
- [ ] **Test 29.3**: Visual guide exists
  - File: TIMEFRAME_TOGGLE_VISUAL_GUIDE.md
  - Expected: UI layout diagrams and specs

---

## Final Checklist

### Pre-Production Verification

- [ ] All functional tests pass
- [ ] All accessibility tests pass
- [ ] All responsive tests pass
- [ ] No console errors or warnings
- [ ] Code is commented and clean
- [ ] Documentation is complete
- [ ] Performance is acceptable (<1s interactions)
- [ ] Visual design matches specifications
- [ ] Keyboard navigation works perfectly
- [ ] Session persistence functions correctly

### Ready for Integration

- [ ] Mock data fetch ready to be replaced with real API
- [ ] Date calculation tested across timezones
- [ ] Error handling implemented for network failures
- [ ] All team members reviewed the implementation
- [ ] User acceptance testing completed (if applicable)

---

## Sign-Off

**Tested by**: _________________  
**Date**: _________________  
**Browser/Version**: _________________  
**Result**: ☐ Pass  ☐ Fail (see notes)  

**Notes**:
```
[Add any issues found or comments here]
```

---

**Test Suite Version**: 1.0  
**Last Updated**: October 14, 2025  
**Total Tests**: 125+
