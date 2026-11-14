"""The Beach Monster: one ElevenLabs voice per character (ready-made voices only), one MP3 per line."""
import json, os, sys, time
from pathlib import Path
import requests

KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
if not KEY:
    sys.exit("ELEVENLABS_API_KEY is not set")
H = {"xi-api-key": KEY}
API = "https://api.elevenlabs.io/v1"
out = Path("beach_out"); out.mkdir(exist_ok=True)

r = requests.get(f"{API}/voices", headers=H, timeout=60)
print("voices:", r.status_code)
r.raise_for_status()
voices = {v["name"].split(" ")[0].lower(): v for v in r.json().get("voices", [])}
print("available:", ", ".join(sorted(voices)))
WANT = {                          # first name that exists wins
    "narrator": ["george", "bill", "brian", "daniel", "callum"],
    "arun": ["liam", "will", "chris", "eric", "charlie"],
    "sheriff": ["bill", "roger", "brian", "daniel", "george"],
    "wealthy": ["charlie", "eric", "callum", "will", "roger"],
    "neighbor": ["laura", "jessica", "sarah", "alice", "lily", "matilda"],
    "villager": ["river", "callum", "eric", "will", "chris"],
}
STYLE = {"narrator": (0.55, 0.85, 0.25), "arun": (0.45, 0.8, 0.45), "sheriff": (0.65, 0.85, 0.2),
         "wealthy": (0.4, 0.8, 0.6), "neighbor": (0.35, 0.8, 0.55), "villager": (0.45, 0.8, 0.4)}
cast, used = {}, set()
for who, names in WANT.items():
    pick = next((n for n in names if n in voices and n not in used), None) or next((n for n in names if n in voices), None) \
        or next(n for n in voices if n not in used)
    cast[who] = voices[pick]["voice_id"]; used.add(pick)
    print(f"{who:9s} -> {voices[pick]['name']}")
(out / "cast.json").write_text(json.dumps({w: next(v['name'] for v in voices.values() if v['voice_id'] == i) for w, i in cast.items()}, indent=1))

lines = json.loads(Path("scripts/beach/lines.json").read_text())
for ln in lines:
    stab, sim, style = STYLE[ln["who"]]
    body = {"text": ln["text"], "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": stab, "similarity_boost": sim, "style": style, "use_speaker_boost": True}}
    for attempt in range(4):
        resp = requests.post(f"{API}/text-to-speech/{cast[ln['who']]}?output_format=mp3_44100_128", headers={**H, "Content-Type": "application/json"},
                             json=body, timeout=120)
        if resp.status_code == 200:
            (out / f"{ln['id']}.mp3").write_bytes(resp.content); print("ok", ln["id"], len(resp.content)); break
        print("retry", ln["id"], resp.status_code, resp.text[:200]); time.sleep(8 * (attempt + 1))
    else:
        sys.exit(f"could not voice {ln['id']}")
    time.sleep(1.2)
u = requests.get(f"{API}/user/subscription", headers=H, timeout=60)
if u.ok:
    j = u.json(); print("credits used", j.get("character_count"), "of", j.get("character_limit"), "tier", j.get("tier"))
