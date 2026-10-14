# Crimson Rhythm themes

The Themes control in the side menu lists the registered palettes. Selecting an option updates the whole app immediately and closes the dropdown. Tap outside it (or use Android Back) to dismiss. Selection lasts for the current app session.

`constants/Theme.ts` contains shared layout, typography, spacing, radii, reusable styles, and independent complete palettes. Neither palette inherits colors from the other. Colors express their context: `text`/`muted` are for cards, `onBackground`/`mutedOnBackground` for the page, and `onPeriod`/`onFertile` for calendar highlights. `calendarSurface`, `calendarPeriod`, `calendarFertile`, and `calendarText` give the calendar its own readable surface and highlights without changing the other semantic surfaces. Date highlights use the shared `radius.calendarDay` token; legend markers use `radius.xs`. Always pair a background with its matching foreground tokens.

```tsx
const { theme, styles } = useAppTheme();
// Use styles.screen, content, card, heading, body, button, buttonText,
// and outlineButton. Use theme tokens for component-specific styles.
```

Add a complete palette to `themes` and its display name to `themeLabels`. TypeScript checks the color contract and labels; `ThemeName` and `themeOptions` are derived automatically. No selector or screen changes are required. Avoid hardcoded colors, importing a fixed palette, and branching on theme names in UI. Shared component geometry belongs in `designTokens` or `createGlobalStyles`.

The home calendar now uses locally saved menstrual/ovulation markings and journal entries, with clearly labeled sample colors on an empty calendar. Insights summarizes saved check-ins. Botanical details are lightweight stylized illustrations.

The bundled Cormorant Garamond font uses the SIL Open Font License (see `assets/fonts/CormorantGaramond-LICENSE.txt`).

Calendar layout integrates compact cycle context beneath the centered month heading, above the date grid. The check-in card follows immediately.


## Calendar editing

`utils/cycle.ts` owns local date keys, inclusive date ranges, range selection, marking replacement/clearing, data validation, and cycle-day calculation. Dates are stored by local YYYY-MM-DD (not UTC timestamps); range math handles DST and month/year boundaries.

`CycleDataProvider` loads and validates saved records, serializes writes, and commits visible state only after a successful save. `DayEditor` saves check-ins and day markings together. Persistence uses Expo-compatible AsyncStorage on device (localStorage on web). Storage is local and unencrypted, with no cloud synchronization; clearing app/browser storage removes these records.

`CalendarGrid` is shared by home and the range editor. Today alone has a sun/drop/flower marker and the matching darker border, independently of the selected day. `today`, `todayPeriod`, `todayFertile`, and `overlay` belong to each palette; inputs and disabled controls use global styles.

Update your cycle data → Calendar → Menstrual/Ovulation → tap start and end → ✓ Save. The editor stays open to mark the other range. Cross-month selections preserve the start date; Jump to month supports year/month selection. Single days can be saved after the first tap. Clear dates removes markings only, preserving check-ins. Tapping a date or a check-in opens its day editor.

Run `npm test` for date/range/restore regression tests, including DST, leap days, cross-year ranges and overlapping corrections.


## Responsive phone layout

Home measures the available space inside the safe area, then sizes the grid from the actual month row count. It targets about 70% of the available height for the calendar, with a compact check-in below. Shared `calendar` sizing tokens control the limits; the minimum avoids making dates unreadably small. Short screens keep scrolling available, with a compact check-in rather than hiding editing features. Large text settings and landscape can require scrolling.

Crimson Rhythm stays on one line with width-dependent type and native font fitting. The inline Update cycle data button replaces the tall standalone calendar button. Check-in uses a compact date/prompt/Log today header; mood/symptom/note shortcuts appear when there is enough height. All fields remain available in the popup at every size.

The side menu replaces the bottom tab bar, and screens retain bottom safe-area padding. Native top insets and the measured content viewport account for notches, home indicators and Android navigation bars. Validate both five- and six-week months when changing sizing tokens.

## Christian features

Gothic Sanctuary is a third independent palette. Its `decoration: 'celestial'` flag enables the moon, halo, stars and moth artwork through shared decoration components. The verse reader uses a praying-hands icon beside Crimson Rhythm (Material folded-hands on Android/web and the praying-hands glyph on iOS).

The header shows a daily KJV Scripture reference. Tapping it or the Bible icon opens a spring/fade reader; reduced-motion settings skip the animation. The reference renders after client hydration so a server in another timezone cannot choose the phone's verse. Holiday markers are preview-only fixed month/day examples, as requested; moveable Easter-related dates are deliberately not calculated. Holiday day popups display the related verse.

Insights now uses real daily check-ins rather than fabricated cycle statistics. It summarizes repeated mood labels over the last 30 days, offers five prepared Scripture reflections per topic with swipe/Previous/Next pagination, and stores daily goals, noticed patterns and a chosen next step locally alongside cycle data. Guidance explanations are commentary, separate from Scripture quotations.

The custom question UI has a server connection ready for AI assistance. It requires `EXPO_PUBLIC_GUIDANCE_API_URL` and the server-only OpenAI key; without them, prepared topics continue to work and the app clearly says personal guidance is not available yet. See `server/README.md` for setup. No key is embedded, no service is deployed, and no live AI call was made in this change.

Verse source: public-domain KJV text, https://www.gutenberg.org/ebooks/10. The verse catalog is bundled and used to bind AI-selected IDs to actual Scripture. Placeholder calendar dates are design data rather than a denominational liturgical calendar.

Soft Petal uses its own light-pink backgrounds, rose highlights, and botanical decoration flag. Shared floral accents and backdrops read its palette; other palettes keep their own decoration and color choices.

## Reference-inspired primary style

Grace & Bloom is the default palette: parchment, ivory cards, dusty rose, sage and brown-burgundy text. Soft Petal retains its independent light pink florals. All four palettes implement the same semantic color contract, including a lighter `placeholder` token.

The route group retains its `(tabs)` folder name for compatibility but now uses a Stack with a shared slide-out navigation menu. Calendar, Insights, Faith & guidance and Journal & goals have working destinations. Themes are available in the menu. The calendar retains the primary mobile viewport space; verse and encouragement cards follow the check-in.

An empty calendar displays explicitly labeled example red/green date squares. They are presentation only and never saved or loaded into an editor as cycle records. Any saved check-in or cycle dates suppress the sample; users can also hide it immediately.
