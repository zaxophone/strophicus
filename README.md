# Chant app

An Expo / React Native app that teaches Gregorian chant from Wilko Brouwers' *Words with Wings*
(CC BY-SA), with live pitch and rhythm feedback from the microphone. It has 20 lessons, a
Repertoire section (currently the Ave Maria, GregoBase #1860) and a tuner.

## Stack

Expo SDK 58, React Native 0.88, TypeScript, yarn. Skia (`@shopify/react-native-skia`) draws the
staff in the Greciliae chant font. `react-native-audio-api` handles microphone input and playback.
Jest for tests.

## Run

```
yarn install
yarn expo run:android      # first build of the dev client
yarn expo start --dev-client
yarn tsc --noEmit && yarn jest
```

## Layout

- `App.tsx`: routes (home, lesson, completion screen, tuner) and the shared reference pitch.
- `src/chant/`: notation. `gabc.ts` parses gabc, `chant.ts` is the model and pitch maths,
  `neumes.ts`/`neumeTable.ts` pick joined figures, `spacing.ts` is Gregorio's column spacing and
  line breaking, `ChantStaff.tsx` draws it (fixed grid for lessons, `flow` for scrolling scores).
- `src/pitch/`: microphone frames to notes. `yin.ts` and `pitchPipeline.ts` detect pitch,
  `noteSegmenter.ts` groups it into sung notes.
- `src/exercise/`: the exercise model and `judge.ts`, which scores note order, pitch and rhythm
  against the key fixed by the first sung note. `pages.ts` paginates instructions.
- `src/audio/`: reference melody, book recordings, session capture and replay.
- `src/progress/`: saved passes, lesson locking and resume point.
- `src/screens/`, `src/ui/`: screens and shared components.
- `src/content/`: lessons as gabc snippets plus instruction text. `wordsWithWings/` (with its own
  `ATTRIBUTION.md`) is the book; `repertoire/` holds free-standing pieces.
- `tools/`: scripts that generate glyph/neume tables and read note heads from scans.

## Notation and content

Notation is standard gabc. The parser refuses what it cannot draw, and `gabc.compile.test.ts`
checks every snippet with the `gregorio` program. Compare new figures against real Gregorio
output, not just the test. Instruction text supports `**bold**`, `__italic__`, `{{clef}}` and
`{{gabc: ...}}` figures.

## Licensing

Lesson content is CC BY-SA. The bundled recordings, the psalm texts in Lessons 1-2 and the
GregoBase chant need permission or licence checks before publishing; see
`src/content/wordsWithWings/ATTRIBUTION.md`.
