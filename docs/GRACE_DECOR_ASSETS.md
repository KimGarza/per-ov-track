# Grace & Bloom ornamental asset slots

This branch replaces the default Grace palette with blush/peach and adds responsive, reusable **code-rendered placeholder ornaments**. It does not include binary PNGs in GitHub yet.

The separately generated transparent artwork pack contains:
- `gold-divider.png` -> OrnamentalDivider (calendar legend separator)
- `title-flourish.png` -> TitleFlourish (month heading)
- `calendar-side.png` -> DecorativeFrame calendar side artwork
- `floral-corner.png` -> DecorativeFrame corners
- `floral-accent.png` -> verse-card corner artwork
- `ornate-cross.png` -> verse-card or header accent

To substitute your hand-drawn images, add PNGs at `assets/decor/grace/` and replace each code-drawn slot with an `Image` using `resizeMode="contain"` and `pointerEvents="none"`. Do not stretch corners: keep corner sizes fixed, with inset border lines resizing with the card. Use mirrored assets sparingly for asymmetric flowers.

The soft left-to-right background tint and paper-grain placeholders use React Native Views (no new native dependencies). Other themes have their own frame/halo palette tokens but their existing decorations remain unchanged. Test rendering and contrast on small Android screens and Expo Web before merging.
