# Petal themes

Choose **Soft Petal** or **Burgundy Bloom** above the calendar. The selection applies to both tabs, shared themed components, cards, botanicals, and navigation. It lasts for the current app session.

`constants/Theme.ts` defines the shared color palettes, typography, spacing, radii, and style factory. `components/ThemeProvider.tsx` owns the active selection.

Use the active theme in new screens:

```tsx
const { theme, styles, name, setName } = useAppTheme();
```

Use `styles.screen`, `styles.card`, `styles.heading`, `styles.body`, and `styles.button`, or derive component styles from `theme.colors`. Do not import the static default palette for new UI. Add palettes to `themes` and add their option to the selector in the calendar screen.

Calendar highlights and cycle statistics are demonstration data; check-in buttons currently show a placeholder message rather than save health records. Botanical details are lightweight stylized illustrations, not the watercolor artwork in the references.

The Cormorant Garamond heading font is bundled locally under the SIL Open Font License (see `assets/fonts/CormorantGaramond-LICENSE.txt`).
