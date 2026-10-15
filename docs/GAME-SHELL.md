# Game shell and adapters

Active rounds share one full-screen layout. A game supplies its puzzle stage and
controls; the shell supplies the header, navigation, progress, prompt, flexible
stage, bottom controls, and feedback slot. Summary pages retain normal scrolling.
Both themes use the same markup and layout.

## Files and responsibilities

- `src/design-options/game-shell.js`: registry, slot mounting, phases, cleanup,
  memory-ready helpers, and accessible header navigation.
- `src/design-options/game-adapters.js`: each game's renderer, presentation,
  optional ready artwork, and visual reveal. Swap an existing game's `render`
  and `reveal` here without changing the round controller or page layout.
- `src/design-options/app-layout.css`: viewport sizing and shared chrome. Game
  CSS styles its own content, without setting page or stage heights.
- Existing game modules: input state, drawing, pointer/keyboard interaction.
- Existing controller: generation, committed guesses, score calculation,
  persistence, round progression, and summary generation.
- `shell_extension.py`: integrates these modules into the existing static build.
  Editable sources stay in `src/`; regenerate `public/` with the build script.

## Mounting a game

A renderer can use the object API directly:

```js
function exampleRound(q) {
  const ui = mountGameShell({
    question: q,
    stage: '<div class="spatial-wrap"><canvas id="example-canvas" width="400" height="300" tabindex="0" aria-label="Adjust your answer"></canvas></div>',
    controls: '<p class="small-instruction">Drag to adjust. Arrow keys also work.</p><button id="example-lock" class="primary">Lock it in</button>',
    phase: 'play'
  });
  // Bind input and draw inside ui.stage. Commit with reveal(value).
  // Register observers and external listeners with ui.onCleanup(...).
}

registerGame('example', {
  render: exampleRound,
  presentation: (q, phase) => ({
    title: q.title,
    subtitle: 'A short explanation of the task.'
  }),
  reveal: (q, value, score) => drawExample(value, q.answer)
});
```

Existing games use `shell(q, stageHTML, controlsHTML, {phase})`, which delegates
to that same object API. `spatialCanvas` also accepts the phase options. Keep IDs
unique within the mounted round. Prompt text is escaped by the shell; newlines
in a presentation title become line breaks. Stage and control HTML are trusted
renderer templates; escape any external text inserted into them.

The returned handles are `stage`, `controls`, `feedback`, `setPhase`, `onCleanup`, and `onRedraw`. These refer to the current mount; do not keep them after mounting
another phase or changing games. The registry rejects duplicate or invalid
registrations and reports an unknown game rather than displaying a blank stage.

## Phases and resource lifecycle

- `ready`: initial state; memory games keep the target hidden until Start.
- `preview`: a timed memory preview, with its existing countdown.
- `play`: a player's interactive answer, including memory-game pickers. Direct-interaction games start here by default.
- `reveal`: the committed guess and target, with common feedback and Next.
- `empty`: the trivia archive's empty state, with a return-to-daily action.

`prepareMemoryStart` and `beginMemoryPreview` manage the shared memory-ready
illustration and phase. The primary action stays in the controls slot throughout.
Memory adapters set `initialPhase: 'ready'`. Optional `ready: {artwork, caption}` in an adapter supplies a neutral illustration.

Use `afterEffect` for timed work so navigation cancels old previews and animations.
Use `onGameCleanup` (or the mount's `onCleanup`) for observers and external event
listeners. Cleanup runs once when a mount is replaced or the player leaves the round.
A reveal keeps its mount and responsive observers until Next. Listeners attached only to a removed stage element do
not need a separate external-listener cleanup.

Register `onGameRedraw(paint)` (or `ui.onRedraw`) to repaint from the current
input state when a theme stylesheet finishes loading. The same callback handles
a locked reveal, without recreating the stage or resetting a guess.

Canvas coordinates remain fixed and use `canvasPointerPoint` /
`canvasDisplayScale`, which account for uniform scaling and letterboxing. High-density canvases can
set `data-logical-width` and `data-logical-height` to keep input in game units
while rendering at the display’s pixel density. Size it up uses this to keep
rectangle strokes sharp, and redraws after responsive resizing. Avoid
mapping pointer coordinates directly through the element's width and height:
that stretches coordinates when the shared stage changes shape. The year picker
and resize handle register their responsive observers with the shared lifecycle,
with window-resize listeners as a fallback when ResizeObserver is unavailable.

## Generation and compatibility

The registry does not alter saved question objects or select daily games. Daily
seeds, IDs, scoring, the trivia schedule, and the save format remain owned by the
existing modules. Legacy proportions, balance, typography and choice renderers
continue through adapters. Presentation titles do not overwrite stored titles.

Replacing the view of an existing game requires only its adapter and renderer.
Adding a new scored game also requires a generator, schedule/practice selection,
scoring/error feedback, summary comparison, and saved-data validation; those
changes are deliberately explicit rather than silently accepting a new schema.

## Verification

```sh
python3 scripts/build-site.py
for test in tests/verify-*.cjs; do node "$test" || exit 1; done
python3 -m unittest discover -s tests -p 'test_*.py'
python3 -m http.server 4175 --directory public
# In another terminal; requires Playwright and Chromium:
node tests/browser-shell.cjs
node tests/browser-size.cjs
```

Browser checks cover all eleven games from ready to reveal and Next at 375×667
and 390×844, actual touch coordinates, keyboard alternatives, appearance changes,
modal focus/Escape, navigation during a preview, extensibility/cleanup, daily and
completed-game reloads, summaries, and larger/narrower viewports. Screenshots are
written outside the repository by default; set `PERCEPTION_SCREENSHOTS` to choose
a destination. `CHROMIUM_PATH` overrides the default Chromium executable.

## Theme layout

`theme-layout.css` supplies the shared structure and typography for Light and
Dark. Keep theme differences in `focus-palette.css` and `night-lab-palette.css`
as colour tokens only. Both themes preload the same UI fonts so switching
appearance preserves text measurements as well as game progress.

Run `node tests/browser-theme-layout.cjs` against the local build server to
compare all eleven games, summaries, and navigation at mobile and desktop sizes.
It also verifies the light palette and that switching themes preserves progress.

## Game appearance

`game-skin.css` owns the shared play surface, type scale, readouts, control
finishes, and reveal treatment. Keep those rules separate from the geometry and
phase layout in `app-layout.css`. `game-paint.js` exposes the same palette, fonts,
and line weights to canvas renderers through `gamePaint()`. Resolve it when
painting so theme changes redraw the existing guess. Preserve intrinsic stimulus
colours (colour memory, 3D pieces, and shapes), coordinates, and stored data.

## Result labels and spacing

`result-layout.css` owns the score-first result panel and completion cards.
`round-feedback.js` supplies named error metrics, units, direction notes, and
separate width/height metrics. Use `resultMetricHTML` for new numeric feedback;
keep scoring and saved question data independent from display text. Optional
registry `label` overrides a game name consistently in prompts and summary cards.
Run `node tests/browser-results.cjs` to check exact/opposing size errors, long
values, source disclosures, and summaries in both themes on small phones.
