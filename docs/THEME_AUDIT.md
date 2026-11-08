# Quick UI/theme audit — 2026-11-08

Current foundation is sound: `constants/Theme.ts` centralizes palettes, spacing, typography, radii and reusable styles; `ThemeProvider` provides a single theme context. Four palettes share the same color contract.

Improvements in this PR:
- Centralized auth-specific dimensions and button styles in the global theme rather than duplicating per-screen styling.
- Welcome screen now uses a constrained centered panel, existing theme typography, consistent buttons, and provider icons.
- Existing OAuth callback now routes to the calendar when a session is available.

Follow-ups (not silently changed):
- Theme selection currently lives in React state and resets on restart; persist preference if desired.
- Some screens still use one-off inline style values; migrate when editing those screens rather than wholesale restyling.
- Google icon is loaded from Google's official image URL; a bundled local asset would remove network dependency.
- Apple icon is a platform-specific glyph on iOS and a drawn approximation on Android; replace with licensed bundled assets for pixel-perfect brand treatment.
- Current `utils/faith.ts` already provides offline, deterministic daily KJV verses from `data/verses.json`. No external API or Gemini is necessary for daily verses; consider expanding and reviewing the curated catalog. The preview church-calendar holiday dates should be replaced before release.
