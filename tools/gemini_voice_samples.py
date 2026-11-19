"""Make storyteller voice samples with Gemini TTS: the same opening read by several voices at a brisk,
gripping storytelling pace. Writes voice_samples/<n>_<voice>.mp3 and a list of durations."""
import base64, os, subprocess, time, wave
from pathlib import Path
import requests

TEXT = ("Grandpa's old radio doesn't play today's news. It plays tomorrow's.\n"
        "\"Ten fifteen tomorrow,\" it crackled. \"A girl on a red bicycle. Mill Road corner. A runaway lorry.\"\n"
        "The next morning, Grandpa put on his coat.")
STYLE = ("a gripping storyteller on the best animated story channels: quick, confident pace, tense and hushed on the scary "
         "words, gives the radio a crackly old-announcer voice; only a short breath between lines, no long dramatic pauses")
VOICES = [("Puck", "a young man (our current voice)"), ("Fenrir", "an excitable young man"), ("Orus", "a firm, deep male storyteller"),
          ("Algenib", "a gravelly male storyteller"), ("Iapetus", "a clear male storyteller"), ("Charon", "a calm, informative male storyteller"),
          ("Sadachbia", "a lively male storyteller"), ("Sulafat", "a warm female storyteller"), ("Kore", "a firm female storyteller")]
MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
out = Path("voice_samples"); out.mkdir(exist_ok=True)
report = []
for i, (voice, who) in enumerate(VOICES, 1):
    prompt = f"Voice: {who}. Delivery: {STYLE}. Speak exactly these words and nothing else:\n{TEXT}"
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    done = False
    for attempt in range(12):
        model = MODELS[attempt % len(MODELS)]
        try:
            r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                              headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]}, json=body, timeout=180)
            if r.status_code != 200:
                print(voice, model, r.status_code, r.text[:200]); time.sleep(25); continue
            data = base64.b64decode(r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            raw = out / "tmp.wav"
            with wave.open(str(raw), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(data)
            mp3 = out / f"{i}_{voice}.mp3"
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-b:a", "128k", str(mp3)], check=True)
            raw.unlink()
            dur = len(data) / 2 / 24000
            report.append(f"{i}. {voice} ({who}): {dur:.1f}s, {model}"); print(report[-1]); done = True; break
        except Exception as e:
            print(voice, model, e); time.sleep(25)
    if not done:
        report.append(f"{i}. {voice}: failed")
    time.sleep(8)
(out / "durations.txt").write_text("\n".join(report) + "\n")
