"""Painted illustrations for the explainers: a new picture every few seconds.

The old look was one still diagram per 30-second section, which reads as a
slideshow. Here every section is cut into shots of one or two sentences; Gemini
plans what each shot should show (a storyboard), a Gemini image model paints
it in one consistent anime-film style, and the video moves slowly across each
painting while the narration plays. Labels are drawn by us as clean text, never
by the image model, which cannot spell.

Any failure here is soft: a section without its pictures falls back to the
drawn diagrams, so the day's video is never lost to an image error.
"""
import base64
import hashlib
import json
import math
import re
import time
from pathlib import Path

from .util import env, log

# One house style for every picture. Described in plain words rather than by
# naming studios: painterly, warm, clear, and built to explain.
STYLE = (
    "Still frame from a high-budget Japanese animated feature film made to teach how technology works. "
    "Hand-painted look: clean confident ink outlines, flat cel shading with two or three tones, "
    "richly painted soft backgrounds, luminous dusk light with warm orange highlights and blue-violet shadows, "
    "gentle glowing particles where energy, light, air or data moves. "
    "Clear readable composition with one obvious subject, cinematic 16:9 framing, lots of depth. "
    "When showing the inside of a machine, use a clean cut-away cross-section or an exploded view. "
    "Absolutely no text, letters, numbers, labels, captions, logos, watermarks or user-interface elements. "
    "No real brands, no real people, no famous characters."
)

PLAN = """You are the storyboard artist for an animated explainer video called "{title}".
The style is fixed (a painted anime feature film); you only decide WHAT each shot shows.

Below are the parts of the narration. For each part, write exactly the number of shots asked for.
Each shot covers the matching stretch of narration, in order, and must show what those words describe.

For each shot give:
- "prompt": 1 to 3 sentences describing the picture: the subject, the camera angle, what is moving or glowing,
  and the setting. Be concrete and physically correct. To explain an inside, ask for a cut-away
  cross-section or an exploded view. To show something invisible (current, ions, heat, radio, data),
  show it as glowing particle trails or light streams. People, if any, are ordinary unnamed people
  seen from behind or at a distance. Never ask for text, numbers, labels, screens with writing, or brands.
- "label": 1 to 4 words we will print on the shot to name the key part (or "" if none is needed).

Vary the framing from shot to shot: wide establishing view, close-up detail, cross-section, exploded view,
a person using the thing in everyday life. Keep the same object design across the video so it feels like one film.

Parts:
{parts}

Return ONLY JSON: {{"parts":[{{"id":"...","shots":[{{"prompt":"...","label":"..."}}]}}],
"thumbnail":"one striking picture for the video's thumbnail: the subject, big and simple, glowing, dramatic"}}"""


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", str(text).strip())
    return [p for p in parts if p.strip()]


def shot_count(text: str, seconds_per_shot: float = 8.0, wpm: float = 150) -> int:
    words = len(str(text).split())
    return max(1, min(5, round(words / (wpm / 60 * seconds_per_shot))))


def storyboard(cfg: dict, data: dict) -> bool:
    """Ask Gemini what each shot shows. Writes data['sections'][i]['shots'] etc."""
    from google import genai
    from google.genai import types
    from .script_writer import pick_models

    ic = cfg.get("explainers", {}).get("illustrate", {})
    sps = float(ic.get("seconds_per_shot", 8))
    pieces = []
    if data.get("hook"):
        pieces.append(("hook", data["hook"]))
    for i, s in enumerate(data["sections"], start=1):
        pieces.append((f"s{i}", s["narration"]))
    if data.get("takeaway"):
        pieces.append(("end", data["takeaway"]))
    want = {pid: shot_count(text, sps) for pid, text in pieces}
    # keep the bill predictable: trim the longest parts first
    cap = int(ic.get("max_images", 26)) - 1          # one is the thumbnail
    while sum(want.values()) > cap and max(want.values()) > 1:
        top = max(want, key=lambda k: want[k])
        want[top] -= 1
    listing = "\n\n".join(f'id "{pid}" - {want[pid]} shot(s):\n{text}' for pid, text in pieces)
    prompt = PLAN.format(title=data["title"], parts=listing)

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg["ai"].get("gemini_model", "auto"))
    for attempt in range(3):
        model = models[min(attempt, len(models) - 1)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json",
                                                   temperature=0.6))
            plan = json.loads(resp.text)
            got = {str(p.get("id")): p.get("shots") or [] for p in plan.get("parts", [])}
            for pid, _text in pieces:
                shots = [{"prompt": str(s.get("prompt", "")).strip()[:600],
                          "label": str(s.get("label", "")).strip()[:32]}
                         for s in got.get(pid, []) if isinstance(s, dict) and s.get("prompt")]
                shots = shots[:want[pid]] or []
                if pid == "hook":
                    data["hook_shots"] = shots
                elif pid == "end":
                    data["end_shots"] = shots
                else:
                    data["sections"][int(pid[1:]) - 1]["shots"] = shots
            data["thumb_prompt"] = str(plan.get("thumbnail", "")).strip()[:600]
            n = sum(len(s.get("shots", [])) for s in data["sections"])
            log(f"Storyboard by {model}: {n} section shots")
            return True
        except Exception as exc:
            log(f"Storyboard attempt {attempt + 1} failed: {exc}")
            time.sleep(10 * (attempt + 1))
    return False


class Painter:
    """Paints shots with a Gemini image model; stops trying after a hard refusal."""

    def __init__(self, cfg: dict, folder: Path):
        ic = cfg.get("explainers", {}).get("illustrate", {})
        self.models = [m for m in ([ic.get("model")] + list(ic.get("fallback_models", []))) if m]
        self.size = str(ic.get("image_size", "1K"))
        self.folder = Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)
        self.budget = int(ic.get("max_images", 26))
        self.made = 0
        self.dead = False
        self.key = env("GEMINI_API_KEY")
        self._client = None

    def _sdk(self, model: str, prompt: str, aspect: str) -> bytes | None:
        from google import genai
        from google.genai import types
        if self._client is None:
            self._client = genai.Client(api_key=self.key)
        try:
            image_cfg = types.ImageConfig(aspect_ratio=aspect, image_size=self.size)
        except Exception:
            image_cfg = types.ImageConfig(aspect_ratio=aspect)
        resp = self._client.models.generate_content(
            model=model, contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"],
                                               image_config=image_cfg))
        for cand in resp.candidates or []:
            for part in (cand.content.parts if cand.content else []) or []:
                blob = getattr(part, "inline_data", None)
                if blob and blob.data:
                    data = blob.data
                    return base64.b64decode(data) if isinstance(data, str) else data
        return None

    def paint(self, prompt: str, name: str, aspect: str = "16:9") -> Path | None:
        if self.dead or not prompt:
            return None
        full = f"{STYLE}\n\nScene: {prompt}"
        digest = hashlib.sha1(f"{aspect}|{full}".encode()).hexdigest()[:10]
        out = self.folder / f"{name}_{digest}.png"
        if out.exists():
            return out
        if self.made >= self.budget:
            log(f"Image budget of {self.budget} reached; {name} stays a diagram")
            return None
        last = None
        for model in self.models:
            for attempt in range(3):
                try:
                    raw = self._sdk(model, full, aspect)
                    if raw:
                        out.write_bytes(raw)
                        self.made += 1
                        return out
                    last = "no image in the reply (likely a safety block)"
                    break                       # same prompt will be refused again
                except Exception as exc:
                    last = exc
                    text = str(exc).lower()
                    if any(k in text for k in ("billing", "permission", "api key", "not found",
                                                "limit: 0", "free_tier", "free tier")):
                        break                   # this model will not work for this key
                    time.sleep(8 * (attempt + 1))
        log(f"Could not paint {name}: {last}")
        if self.made == 0 and last and any(k in str(last).lower() for k in
                                           ("billing", "permission", "limit: 0", "free_tier",
                                            "free tier", "api key")):
            log("Image generation is not available on this Gemini key (billing needed?); "
                "the rest of the video uses diagrams.")
            self.dead = True
        return None


def paint_shots(painter: Painter, shots: list[dict], name: str) -> list[dict]:
    """Paint every shot of one part; returns the shots that have a picture."""
    done = []
    for k, shot in enumerate(shots, start=1):
        path = painter.paint(shot["prompt"], f"{name}_{k}")
        if path:
            done.append({**shot, "image": str(path)})
    return done


def timings(narration: str, seconds: float, n: int) -> list[float]:
    """Split a part's running time across n shots, by where the sentences fall."""
    if n <= 1:
        return [seconds]
    sents = _sentences(narration) or [narration]
    ends, acc = [], 0
    for s in sents:
        acc += len(s.split())
        ends.append(acc)
    total = acc or 1
    # cut at the sentence end nearest each even split, so a picture changes
    # between sentences rather than mid-thought
    marks = [0.0]
    for k in range(1, n):
        ideal = total * k / n
        options = [e for e in ends[:-1] if e > marks[-1]]
        pick = min(options, key=lambda e: abs(e - ideal)) if options else ideal
        if abs(pick - ideal) > total / (2 * n):
            pick = ideal                                # no sentence end nearby
        marks.append(max(pick, marks[-1] + 1))
    marks.append(total)
    durs = [seconds * (b - a) / total for a, b in zip(marks, marks[1:])]
    if min(durs) < 2.5:                                 # never a flash
        return [seconds / n] * n
    return durs
