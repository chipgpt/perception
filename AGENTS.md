# Perception project instructions

## Design and implementation

- Always design and implement mobile first, with progressive enhancement.
- Start with the layout, interactions, and essential functionality for ordinary phone screens. Add larger-screen layouts and optional browser capabilities as enhancements.
- Keep the active puzzle and its essential controls within the phone viewport where reasonably possible; avoid requiring page scrolling to play. Micro phone screens do not need special support.
- Use touch-friendly targets and gestures, accessible labels, and keyboard alternatives where relevant. Do not rely on hover for essential functionality.
- Provide functional fallbacks when enhanced browser features are unavailable.
- Validate changes at a realistic mobile viewport first, then check larger screens. Preserve a player's progress when applying appearance changes.

## Scoring policy

- New games use linear closeness: `round(100 * clamp(1 - error / zeroPointBound, 0, 1))`. Tune the game's error measure and bound; do not add a power curve.
- Score independent dimensions separately and average their closeness before rounding. Opposing errors must not cancel.
- Freeze scoring versions on questions and gate daily changes by challenge date. Preserve historical questions, saved results, and earned scores.
