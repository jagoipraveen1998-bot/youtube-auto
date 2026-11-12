"""A review pass after every render, using the craft rules from HyperFrames (heygen-com/hyperframes,
Apache-2.0: skills/hyperframes/references review.md, motion.md, sound.md, types/vertical.md).

It measures what can be measured and writes REVIEW.txt next to the video:
P0 = breaks the read, P1 = weakens the film, P2 = polish. It never stops a run; it tells us what to fix.
"""
import json
import re
import subprocess
from pathlib import Path

from .util import log

FPS = 30


def _words(s: str) -> int:
    return len([w for w in re.split(r"\s+", s or "") if w])


def _loudness(video: Path) -> tuple[float | None, float | None]:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True)
    txt = r.stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", txt)
    p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", txt)
    return (float(i[-1]) if i else None), (float(p[-1]) if p else None)


def review(story: dict, plan: dict, video: Path, fmt: str) -> list[str]:
    notes = []
    shots = plan["shots"]
    vert = fmt == "vertical"
    t = lambda f: f"{int(f / FPS // 60)}:{f / FPS % 60:05.2f}"

    # the first second is the hook: frame 0 is the thumbnail on social players
    if vert and plan.get("intro", 0) > 0 and plan.get("coldOpen") is None:
        notes.append(f"P1 · 0:00 · the Short opens on the logo sting ({plan['intro'] / FPS:.1f}s) → open on the story's first shot")
    first_voice = next((s for s in shots if s.get("caps")), None)
    if vert and first_voice and first_voice["ls"] / FPS > 1.5:
        notes.append(f"P1 · {t(first_voice['ls'])} · first words arrive late → the hook line should start within about 1 s")

    # dead stretches: more than 3 s with nothing changing
    for i, s in enumerate(shots):
        dur = (s["b"] - s["a"]) / FPS
        busy = s.get("caps") or s.get("beat") is not None or s.get("cam") not in (None, "", "static", "wide") \
            or s.get("anim") or s.get("walk") or s.get("zoom") or s.get("react", "none") != "none"
        if dur > 3.0 and not busy and s.get("scene") != "black":
            notes.append(f"P1 · {t(s['a'])} · shot {i} ({s.get('scene')}) holds {dur:.1f}s with nothing changing → add a move, a reaction or cut it shorter")
        if vert and dur > 5.0 and not s.get("caps"):
            notes.append(f"P2 · {t(s['a'])} · shot {i} is {dur:.1f}s with no words; Shorts want a new beat every 2–4 s")

    # lines the viewer must read: 0.5 s + 0.3 s a word (film subtitles)
    beats = story.get("beats", [])
    if plan.get("film"):
        for i, (b, s) in enumerate(zip(beats, shots)):
            if b.get("line") and not b.get("nosubs"):
                need = 0.5 + 0.3 * _words(b["line"])
                have = (s["b"] - s["ls"]) / FPS
                if have < need - 0.2:
                    notes.append(f"P1 · {t(s['ls'])} · subtitle '{b['line'][:30]}' shows {have:.1f}s, needs {need:.1f}s to read → longer gap after it")

    # requested timestamps ("at" on a beat): within 1 s
    for i, (b, s) in enumerate(zip(beats, shots)):
        if b.get("at") is not None:
            off = s["ls"] / FPS - float(b["at"])
            if abs(off) > 1.0:
                notes.append(f"P0 · {t(s['ls'])} · '{(b.get('line') or '')[:30]}' was asked for {b['at']:.1f}s, lands {off:+.1f}s off")

    # pacing
    if vert and shots:
        n = sum(2 if plan.get("cuts") and not s.get("twist") and s["b"] - s["a"] > 84 else 1 for s in shots)
        avg = plan["frames"] / FPS / n
        if avg > 4.0:
            notes.append(f"P2 · whole Short · average shot {avg:.1f}s; Shorts read best at 2–4 s a shot")

    # sound: measured, not heard
    lufs, peak = _loudness(video)
    if lufs is not None and not (-16.5 <= lufs <= -13.0):
        notes.append(f"P1 · mix · loudness {lufs:.1f} LUFS, social wants about -14")
    if peak is not None and peak > -1.0:
        notes.append(f"P1 · mix · true peak {peak:.1f} dBFS, keep it at -1 or lower")

    order = {"P0": 0, "P1": 1, "P2": 2}
    notes.sort(key=lambda n: order[n[:2]])
    head = [f"REVIEW ({fmt}, {plan['frames'] / FPS:.1f}s, {len(shots)} shots) — loudness {lufs} LUFS, peak {peak} dBFS (measured, not heard)"]
    out = head + (notes or ["No problems found by the measured checks."])
    (video.parent / "REVIEW.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
    log("Review:\n" + "\n".join(out))
    return notes
