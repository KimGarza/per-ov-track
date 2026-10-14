# Crimson Rhythm themes

The Themes control at the top right of Calendar lists the registered palettes. Selecting an option updates the whole app immediately and keeps the dropdown open. Tap outside it (or use Android Back) to dismiss. Selection lasts for the current app session.

`constants/Theme.ts` contains shared layout, typography, spacing, radii, reusable styles, and independent complete palettes. Neither palette inherits colors from the other. Colors express their context: `text`/`muted` are for cards, `onBackground`/`mutedOnBackground` for the page, and `onPeriod`/`onFertile` for calendar highlights. Always pair a background with its matching foreground tokens.

```tsx
const { theme, styles } = useAppTheme();
// Use styles.screen, content, card, heading, body, button, buttonText,
// and outlineButton. Use theme tokens for component-specific styles.
```

Add a complete palette to `themes` and its display name to `themeLabels`. TypeScript checks the color contract and labels; `ThemeName` and `themeOptions` are derived automatically. No selector or screen changes are required. Avoid hardcoded colors, importing a fixed palette, and branching on theme names in UI. Shared component geometry belongs in `designTokens` or `createGlobalStyles`.

Calendar highlights and cycle statistics are demonstration data; check-in buttons currently show a placeholder message rather than save health records. Botanical details are lightweight stylized illustrations.

The bundled Cormorant Garamond font uses the SIL Open Font License (see `assets/fonts/CormorantGaramond-LICENSE.txt`).
