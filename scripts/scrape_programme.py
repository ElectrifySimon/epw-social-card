#!/usr/bin/env python3
"""Pull the Energy Planning Week programme into src/data/programme.json.

The portal publishes one table per day. Each row is:

    <th scope="row">10:25-12:00</th>
    <td><b>Session 1: Title</b><br>Co-hosted with UNFCCC<br>Speaker A, Speaker B</td>

so the split is reliable. The script keeps a fingerprint of the parsed
programme next to the JSON: when a title, time or speaker changes, the next
build sees a different hash and the diff is worth a look.

    python3 scripts/scrape_programme.py
    python3 scripts/scrape_programme.py --check   # exit 1 if the site moved on
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

URL = "https://energyplanningweek.info/"
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "programme.json"

BREAK_WORDS = (
    "coffee",
    "lunch break",
    "registration",
    "closing and logistics",
    "wrap and bridge",
)
ADMIN_WORDS = ("welcome dinner", "reception", "lunch", "closing remarks", "closing of")


def scrape() -> dict:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--no-sandbox"])
        pg = b.new_page(viewport={"width": 1400, "height": 1000})
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_timeout(1500)
        raw = pg.evaluate(
            """() => {
              const heads = [...document.querySelectorAll('h1,h2,h3,h4')]
                .filter(h => /^Day \\d/.test(h.innerText.trim()));
              const tables = [...document.querySelectorAll('table')]
                .filter(t => t.querySelector('th'));
              return tables.map(t => {
                const head = [...heads].reverse()
                  .find(h => h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING);
                const rows = [...t.querySelectorAll('tr')].map(tr => {
                  const th = tr.querySelector('th');
                  const td = tr.querySelector('td');
                  return { time: th ? th.innerText.trim() : '', cells: td ? td.innerHTML : '' };
                });
                return { heading: head ? head.innerText.trim() : '', rows };
              });
            }"""
        )
        b.close()
    return {"url": URL, "source": "energyplanningweek.info", "days": raw}


def split_cell(html: str) -> dict:
    parts = [re.sub(r"<[^>]+>", "", p).strip() for p in re.split(r"<br\s*/?>", html)]
    parts = [p for p in parts if p]
    if not parts:
        return {"title": "", "cohost": "", "speakers": [], "kind": "other"}
    title = parts[0]
    cohost = ""
    people: list[str] = []
    for p in parts[1:]:
        if p.lower().startswith("co-hosted with"):
            cohost = p[len("co-hosted with") :].strip()
            if cohost.lower().startswith("the "):
                cohost = cohost[4:]
            cohost = cohost[:1].upper() + cohost[1:]
        else:
            people = [x.strip() for x in p.split(",") if x.strip()]
    low = title.lower()
    structured = any(w in low for w in ("session", "deep dive", "keynote", "presentation"))
    is_break = any(low.startswith(w) for w in BREAK_WORDS) and not structured
    if structured:
        kind = "session"
    elif is_break:
        kind = "break"
    elif any(low.startswith(w) for w in ADMIN_WORDS):
        kind = "admin"
    else:
        kind = "other"
    number = None
    m = re.match(r"(?:session|deep dive)\s+(\d+)", low)
    if m:
        number = int(m.group(1))
    return {"title": title, "cohost": cohost, "speakers": people, "kind": kind, "number": number}


def normalise(raw: dict) -> dict:
    days = []
    for i, day in enumerate(raw["days"], start=1):
        heading = day["heading"]
        theme = heading.split(":", 1)[1].strip() if ":" in heading else ""
        items = []
        for row in day["rows"]:
            if not row["cells"]:
                continue
            info = split_cell(row["cells"])
            if not info["title"]:
                continue
            items.append(
                {
                    "day": i,
                    "time": row["time"].replace("\u2013", "-"),
                    "title": info["title"],
                    "cohost": info["cohost"],
                    "speakers": info["speakers"],
                    "kind": info["kind"],
                    "number": info["number"],
                    "id": slug(info["title"]),
                }
            )
        days.append({"day": i, "heading": heading, "theme": theme, "items": items})
    return {
        "event": {
            "title": "Energy Planning Week 2026",
            "dates": "1-4 December 2026",
            "venue": "GIZ Campus Forum, Bonn",
            "url": "https://energyplanningweek.info/",
        },
        "days": days,
    }


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:60]


def fingerprint(data: dict) -> str:
    keep = [
        (d["day"], i["time"], i["title"], i["cohost"], tuple(i["speakers"]))
        for d in data["days"]
        for i in d["items"]
        if i["kind"] == "session"
    ]
    return hashlib.sha256(json.dumps(keep, sort_keys=True).encode()).hexdigest()[:12]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="compare with the stored fingerprint only")
    args = ap.parse_args()

    data = normalise(scrape())
    fp = fingerprint(data)
    sessions = [i for d in data["days"] for i in d["items"] if i["kind"] == "session"]
    data["fingerprint"] = fp
    data["counts"] = {"sessions": len(sessions), "rows": sum(len(d["items"]) for d in data["days"])}

    if args.check:
        if not OUT.exists():
            print("no stored programme")
            return 1
        old = json.loads(OUT.read_text())
        same = old.get("fingerprint") == fp
        print(json.dumps({"same": same, "old": old.get("fingerprint"), "new": fp}))
        return 0 if same else 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"path": str(OUT), "sessions": len(sessions), "rows": data["counts"]["rows"], "fingerprint": fp}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
