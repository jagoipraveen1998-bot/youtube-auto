# 3D studio (cartoon-short-kit)
- `web/lib/three.module.js`: three.js r160, MIT licence (https://github.com/mrdoob/three.js).
- `web/toonbase.js`: the Pen / head / face drawing library from mromidev/claude-animated-shorts, MIT licence
  (Copyright (c) 2026 Mr omi), with its TypeScript types removed.
- Everything else here (the house set, cast, stories, sound) is our own.
After editing `web/roman.js` (the cast) run: `cat web/toonbase.js web/roman.js > web/toon.js`

## Reusable sets (our own)
- `web/sets.js`: places any story can use — `granRoom` (Grandma's room: cupboard, radio-cassette, bulb), `bedroom` (bed, keypad door, window onto the driveway, photo frame), `street` (road to school, lamppost poster, police car). Each returns world-space spots `A` and a `state(W, f)` to animate it.
- `web/kit.js`: `makeStory()` turns shot ids + cameras + lights into everything main.js needs; also `actor`, `fx`, `word`, `MOODS`.
- `soundkit.py`: `Mix` with room tone, hum, hiss, clicks, creaks, knocks, beeps, stings, music box. A story's `sound.py` is a few lines.
- A new story = `stories/<name>/story.js` (pick a set, list shots and cameras), `sound.py`, `LINES`, and `"three_d": "<name>"` in the script.
