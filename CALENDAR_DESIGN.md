# Editing the calendar

## Switch menstrual drops to circles

1. Open `constants/Theme.ts`.
2. Find `designTokens`, then `calendar`, then `menstrualShape`.
3. Change only the first quoted value:

```ts
menstrualShape: 'circle' as 'drop' | 'circle'
```

Use `'drop'` in that first position to restore droplets. Leave `as 'drop' | 'circle'` unchanged: it declares the allowed options. Save and refresh the preview. This changes menstrual markers and their legend across themes, including range selection, without changing saved cycle data or palette colors.

For a custom silhouette, open `components/CalendarGrid.tsx` and find `DropMarker` near the top. Its circular branch has `borderRadius: 100`; its droplet branch uses 70% width/height, 15% left, 17% top, one pointed corner (`borderTopLeftRadius: 2`) and a 45-degree rotation. Edit those values to experiment. `FlowerMarker` immediately below draws ovulation flowers.

## Title and dates

In `components/CalendarGrid.tsx`, find `createStyles` near the bottom:

- `month`: title font size, family and alignment.
- `dayText`: date number appearance.
- `weekday`: Sun–Sat labels.
- `day`: date button geometry.
- `cell`: date cell spacing.

`MonthNavigation` near the top also applies `compact && { fontSize: 28 }`. Home uses compact mode, so edit **28** there when adjusting the home month title. The noncompact base is `month.fontSize`.

The heading is centered across the full calendar width. On screens under 560px the update button sits on the right of the navigation row underneath; on wider screens a matching left spacer balances the button beside the title.

## Overall size and content order

`src/app/(tabs)/index.tsx` owns `calendarHeight`, `rowHeight`, and the home calendar card padding. Shared row-height limits are in `constants/Theme.ts` → `designTokens.calendar`. Home now orders Calendar → Verse → How are you feeling? → shortcuts.

## Colors and fonts

Keep color changes in `constants/Theme.ts` → the relevant theme's palette. `calendarPeriod`, `calendarFertile` and `calendarText` are the menstrual fill, fertile fill and date text colors. Unconfirmed fills derive a lighter version without replacing those base colors.

Each palette's `defineTheme` call has a final fonts object with `heading`, `body`, and `journal` keys. Change the relevant family there for that theme only. Bundled aliases available now are `CormorantGaramond` and `SpaceMono`; the system default is selected through `designTokens.fonts.body`. Additional custom fonts need assets registered in `src/app/_layout.tsx`'s `useFonts` map before using their alias.

Browse Apple system fonts at https://developer.apple.com/fonts/system-fonts/ (filter by iOS & iPadOS and System font). Android's compatibility family list is at https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/data/fonts/fonts.xml — technical, not a visual gallery or guaranteed inventory for every device. Google Fonts (https://fonts.google.com/) is a visual catalog for custom fonts that can be bundled; it is not a list of fonts already installed on phones.
