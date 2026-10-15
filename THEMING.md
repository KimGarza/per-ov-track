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

Grace & Bloom is the default palette: tan-pink (`#E9D7C9`), warm ivory cards, soft coral-pink, sage and brown-burgundy text. Soft Petal retains its independent light pink florals. All four palettes implement the same semantic color contract, including a lighter `placeholder` token.

The route group retains its `(tabs)` folder name for compatibility but now uses a Stack with a shared slide-out navigation menu. Calendar, Insights, Faith & guidance and Journal & goals have working destinations. Themes are available in the menu. The calendar retains the primary mobile viewport space; verse and encouragement cards follow the check-in.

An empty calendar displays explicitly labeled example red/green date squares. They are presentation only and never saved or loaded into an editor as cycle records. Any saved check-in or cycle dates suppress the sample; users can also hide it immediately.

The Grace & Bloom palette uses the requested tan-pink page background and coral accents. Scripture references appear without a redundant “Daily verse” suffix. Verse cards reuse palette-aware floral accents. A reserved illustration card uses lightweight stylized scenery as a replaceable placeholder; it is not a photograph.

## Pink cycle action and flower dates

The home month header now contains the Update cycle data pill. `cycleAction` and `onCycleAction` provide independent pink palettes with readable text. Month headings are two points larger. Navigation arrows and cycle context sit just beneath that row. Ovulation date markers and the legend use the shared five-petal `FlowerMarker` with the existing fertile color; menstrual squares and today/selection indicators remain readable. The same marker renderer is used in range selection.

Daily check-in offers Typing and Voice memo modes. Voice memo is an explicitly labeled prototype with a fixed sample transcript and sample AI summary; it records nothing and makes no AI calls. The sample is only placed into notes after the user selects the explicit sample-copy action and is saved through the normal check-in flow.

## Calendar-first overlays

The calendar is the primary screen. The side menu only contains Themes, Settings, Billing and Subscription. These open a shared large primary modal; Insights, Faith and Journal open the same modal from shortcuts below the check-in. The underlying calendar remains mounted, preserving its selected date, displayed month and scroll position. Themes close after selecting a palette. Billing and Subscription are explicit unconnected placeholders with no checkout or fabricated account status.

`SideMenuProvider` hosts the shared menu/modal state. The drawer and primary content share one native Modal to avoid overlapping dismissal/presentation transitions. `EditSheet` supports an embedded primary presentation with the same close, back, keyboard and scroll behavior as editors. `expo-blur` wraps the calendar in a BlurTargetView, and renders a sibling BlurView behind the modal (including Android's explicit target). Legacy Insights/Faith/Journal URLs redirect into the calendar with the corresponding modal open.

Insights and Journal content now live outside the route tree as reusable components. Existing local check-ins, guidance, goals and the voice preview remain available within overlays.

## Intentional palette edits, fonts and diary

All existing palette color values were preserved from the user's latest dev edits. Main body/calendar lettering now uses the existing main text tokens rather than muted styles. Confirmed menstrual markings use a circle and drop; fertile markings use flowers. Today has a small dot below its date. Future plans and sample estimates use a lighter mix of that theme's cycle color and calendar surface. The original base colors are never overwritten.

`pendingDays` records future manual plans so the passage of time cannot confirm them automatically. Logging a due/past marking explicitly confirms it; editing unrelated check-in text preserves pending status. Existing future records are migrated as pending on load. This is a display/confirmation model, not a new automatic cycle prediction algorithm. Sample markings remain clearly labeled sample data and are never stored as health records.

Themes have independent heading/body/journal font slots. CormorantGaramond and SpaceMono are bundled and loaded through Expo Font; the third option is the platform's system font. Themes includes previews and per-slot controls; overrides remain isolated per theme for the session. Browse https://fonts.google.com/ for more families; additional TTF/OTF assets must be bundled and registered before adding them to the picker.

The book icon next to the prayer icon opens a lined diary with a spine, lightweight sunlight bands and reduced-motion-aware page turns. Entries save locally by date in `diary`, separate from cycle check-in notes. Saving occurs before turning/closing; a failed save keeps the current page and text open. The optional diary/pending fields remain compatible with older records.

The newly introduced expo-blur dependency has been removed to avoid a native-module requirement for the shell. The existing calendar uses a built-in blur filter on web/Android 12+, with a dimmed fallback on iOS/older Android. Primary overlays continue working without an additional native package; native devices still require validation.

## Compact appearance menu and journal toolbar

Themes now opens a small anchored pop-out beside/below the sidebar control, with only registered theme names. Choosing a name closes it; clicking outside dismisses it. Font customization was removed from Themes.

The journal contains a small pill toolbar for Font, Color and Highlight. Each opens the shared bounded option popover, dismissible by selecting an option, clicking away or Android Back. Font/ink/page-highlight choices are saved per diary date in `diaryStyles` alongside the text and restored on page turns/reopening. Highlight applies a page-wide blush/sage wash; this is not selected-text rich-text highlighting. All inks and washes use existing theme tokens. Older plain-string diary entries remain compatible.

Today's marker is a sibling below the date button, with reserved vertical clearance so the date border cannot cover it. Settings offers Circle and Heart variants (session preference), and the legend follows the choice. No existing palette literals were changed.
