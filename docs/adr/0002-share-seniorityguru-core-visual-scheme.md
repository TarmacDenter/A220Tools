---
status: accepted
---

# Share SeniorityGuru's core visual scheme

A220Tools uses the same core look as SeniorityGuru so the apps read as one family: IBM Plex Sans for text and controls, IBM Plex Mono for figures, tabular numerals, ink (near-black in light mode, paper-white in dark mode) as the primary color, and SeniorityGuru's night-paper surfaces in dark mode. Fonts are bundled with `@fontsource` so the app keeps working offline. Token values live in `app/assets/css/theme.css`.

## Considered Options

- **Copy SeniorityGuru exactly, including greenbar paper and the yellow highlighter:** rejected. In A220Tools green means safe and yellow/amber means warning or true-wind entry, so a green page and a yellow highlight would dilute those signals.
- **Keep the stock blue and slate look:** rejected because it shares nothing with the other apps.

## Consequences

- Light mode is A220Tools' own neutral paper, tuned so every text/background pair is at least 6:1, because the app is read in cockpit daylight.
- Safe, unsafe and warning hues stay as they were; only their text shades were darkened for contrast.
- A disabled primary button has its own text token (`--color-primary-disabled-text`), because ink text on a disabled ink button is unreadable in either mode.
