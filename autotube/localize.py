"""Other languages on YouTube: translated titles/descriptions (viewers see them in their own language) and
translated subtitles, added right after upload. Free: one Gemini text request per video."""
import io
import json
import re

from .util import env, log

LANGS = {"hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada", "ml": "Malayalam", "bn": "Bengali",
         "mr": "Marathi", "es": "Spanish", "pt": "Portuguese", "id": "Indonesian", "ar": "Arabic", "fr": "French",
         "de": "German"}


def _ts(t: float) -> str:
    h, r = divmod(max(0.0, t), 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"


def srt(lines: list[tuple[float, float, str]]) -> str:
    return "\n".join(f"{i + 1}\n{_ts(a)} --> {_ts(b)}\n{t}\n" for i, (a, b, t) in enumerate(lines))


def subtitle_lines(story: dict, plan: dict, fps: int = 30) -> list[tuple[float, float, str]]:
    out = []
    for b, sh in zip(story.get("beats", []), plan.get("shots", [])):
        if b.get("line") and sh.get("ls") is not None:
            out.append((sh["ls"] / fps, max(sh["le"], sh["ls"] + 20) / fps, b["line"].replace("*", "")))
    return out


def translate(cfg: dict, title: str, description: str, lines: list[str]) -> dict:
    """{lang: {"title", "description", "lines"}} for every language, in one request."""
    from google import genai
    from google.genai import types
    from .script_writer import pick_models
    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    prompt = (
        "Translate this animated horror Short for viewers in other languages. Keep it natural and spoken, the same "
        "creepy-funny tone, the same number of subtitle lines in the same order. Keep hashtags like #shorts #horror "
        "at the end of titles. Titles under 95 characters.\n"
        f"Languages (codes): {json.dumps(LANGS)}\n"
        "Return ONLY JSON: {\"<code>\": {\"title\": \"...\", \"description\": \"...\", \"lines\": [\"...\"]}}\n\n"
        f"TITLE: {title}\nDESCRIPTION: {description[:1500]}\nLINES:\n" + "\n".join(lines))
    import time
    models = pick_models(client, cfg.get("ai", {}).get("gemini_model", "auto"))[:4]
    for attempt in range(8):                         # free tier: a few requests a minute, so wait and retry
        model = models[attempt % len(models)]
        try:
            r = client.models.generate_content(model=model, contents=prompt, config=types.GenerateContentConfig(
                response_mime_type="application/json", temperature=0.3))
            data = json.loads(r.text)
            return {k: v for k, v in data.items() if k in LANGS and isinstance(v, dict) and v.get("title")}
        except Exception as exc:
            msg = str(exc)
            log(f"Translation with {model} failed: {msg[:300]}")
            if "PerDay" in msg:
                models = [m for m in models if m != model] or models
            time.sleep(25 if "429" in msg else 5)
    return {}


def add_languages(cfg: dict, video_id: str, title: str, description: str, subs: list[tuple[float, float, str]],
                  token_env: str = "YT_HORROR_REFRESH_TOKEN") -> int:
    """Translated titles/descriptions + subtitles in every language. Never stops the run: returns languages added."""
    try:
        from googleapiclient.http import MediaIoBaseUpload
        from .uploader import _client
        tr = translate(cfg, title, description, [t for _, _, t in subs])
        if not tr:
            return 0
        yt = _client(token_env)
        v = yt.videos().list(part="snippet,localizations", id=video_id).execute()["items"][0]
        loc = v.get("localizations", {})
        for code, d in tr.items():
            loc[code] = {"title": re.sub(r"[<>]", "", d["title"])[:100], "description": re.sub(r"[<>]", "", d.get("description", ""))[:4900]}
        snip = v["snippet"]
        snip.setdefault("defaultLanguage", "en")
        yt.videos().update(part="snippet,localizations", body={"id": video_id, "snippet": {
            k: snip[k] for k in ("title", "description", "categoryId", "tags", "defaultLanguage", "defaultAudioLanguage") if k in snip},
            "localizations": loc}).execute()
        log(f"Translated titles and descriptions: {', '.join(LANGS[c] for c in tr)}")
        added = 0
        for code, d in (tr.items() if subs else []):          # subtitles only when the line timing is known
            ls = d.get("lines") or []
            if len(ls) != len(subs):
                continue
            body = srt([(a, b, t) for (a, b, _), t in zip(subs, ls)])
            try:
                yt.captions().insert(part="snippet", body={"snippet": {"videoId": video_id, "language": code,
                                                                        "name": LANGS[code], "isDraft": False}},
                                     media_body=MediaIoBaseUpload(io.BytesIO(body.encode("utf-8")), mimetype="application/octet-stream")).execute()
                added += 1
            except Exception as exc:
                log(f"Subtitles in {LANGS[code]} not added: {str(exc)[:400]}")
                if "insufficient" in str(exc).lower() or "403" in str(exc):
                    break                                     # the token is missing the captions permission
        log(f"Subtitles added in {added} languages")
        return len(tr)
    except Exception as exc:
        log(f"Other languages skipped: {str(exc)[:200]}")
        return 0
