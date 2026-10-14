# Crimson Rhythm themes

The Themes control at the top right of Calendar lists the registered palettes. Selecting an option updates the whole app immediately and keeps the dropdown open. Tap outside it (or use Android Back) to dismiss. Selection lasts for the current app session.

`constants/Theme.ts` contains shared layout, typography, spacing, radii, reusable styles, and independent complete palettes. Neither palette inherits colors from the other. Colors express their context: `text`/`muted` are for cards, `onBackground`/`mutedOnBackground` for the page, and `onPeriod`/`onFertile` for calendar highlights. `calendarSurface`, `calendarPeriod`, `calendarFertile`, and `calendarText` give the calendar its own readable surface and highlights without changing the other semantic surfaces. Date highlights use the shared `radius.calendarDay` token; legend markers use `radius.xs`. Always pair a background with its matching foreground tokens.

```tsx
const { theme, styles } = useAppTheme();
// Use styles.screen, content, card, heading, body, button, buttonText,
// and outlineButton. Use theme tokens for component-specific styles.
```

Add a complete palette to `themes` and its display name to `themeLabels`. TypeScript checks the color contract and labels; `ThemeName` and `themeOptions` are derived automatically. No selector or screen changes are required. Avoid hardcoded colors, importing a fixed palette, and branching on theme names in UI. Shared component geometry belongs in `designTokens` or `createGlobalStyles`.

The home calendar now uses locally saved menstrual/ovulation markings and journal entries, with no fabricated monthly highlights. Insights still shows demonstration statistics. Botanical details are lightweight stylized illustrations.

The bundled Cormorant Garamond font uses the SIL Open Font License (see `assets/fonts/CormorantGaramond-LICENSE.txt`).

Calendar layout integrates compact cycle context beneath the centered month heading, above the date grid. The check-in card follows immediately.


## Calendar editing

`utils/cycle.ts` owns local date keys, inclusive date ranges, range selection, marking replacement/clearing, data validation, and cycle-day calculation. Dates are stored by local YYYY-MM-DD (not UTC timestamps); range math handles DST and month/year boundaries.

`CycleDataProvider` loads and validates saved records, serializes writes, and commits visible state only after a successful save. `DayEditor` saves check-ins and day markings together. Persistence uses Expo-compatible AsyncStorage on device (localStorage on web). Storage is local and unencrypted, with no cloud synchronization; clearing app/browser storage removes these records.

`CalendarGrid` is shared by home and the range editor. Today alone has a sun/drop/flower marker and the matching darker border, independently of the selected day. `today`, `todayPeriod`, `todayFertile`, and `overlay` belong to each palette; inputs and disabled controls use global styles.

Update your cycle data → Calendar → Menstrual/Ovulation → tap start and end → ✓ Save. The editor stays open to mark the other range. Cross-month selections preserve the start date; Jump to month supports year/month selection. Single days can be saved after the first tap. Clear dates removes markings only, preserving check-ins. Tapping a date or a check-in opens its day editor.

Run `npm test` for date/range/restore regression tests, including DST, leap days, cross-year ranges and overlapping corrections.
