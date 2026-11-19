"""Quick ElevenLabs check: two lines with the configured voice; prints the reason if refused."""
import os, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import requests
from autotube.eleven import eleven_take, _h, API
r = requests.get(f"{API}/user/subscription", headers=_h(), timeout=30); print("subscription", r.status_code, r.text[:400])
r = requests.get(f"{API}/voices", headers=_h(), timeout=30); print("voices", r.status_code, [(v["name"], v["voice_id"], v.get("category")) for v in r.json().get("voices", [])][:20] if r.ok else r.text[:300])
out = pathlib.Path("voice_samples"); out.mkdir(exist_ok=True)
w = eleven_take(["Grandpa's old radio doesn't play today's news. It plays tomorrow's.", "\"Ten fifteen tomorrow,\" it crackled. \"A girl on a red bicycle.\""],
                {"voice": "Jeremy", "speed": 1.08}, out / "jeremy")
print("take", w)
if w:
    import subprocess; subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(w), str(out / "jeremy.mp3")]); w.unlink()
(out / "durations.txt").write_text(str(w))
