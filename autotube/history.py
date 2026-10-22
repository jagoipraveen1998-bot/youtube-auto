"""Remembers which articles were already covered so videos never repeat a story."""
import json
from pathlib import Path

from .util import ROOT

FILE = ROOT / "data" / "history.json"


def load() -> dict:
    if FILE.exists():
        return json.loads(FILE.read_text(encoding="utf-8"))
    return {"used_links": [], "videos": []}


def save(hist: dict, links: list[str], video: dict) -> None:
    hist["used_links"] = (hist["used_links"] + links)[-1500:]
    hist["videos"] = (hist["videos"] + [video])[-365:]
    FILE.parent.mkdir(parents=True, exist_ok=True)
    FILE.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
