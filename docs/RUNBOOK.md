# EPW 2026 session card builder: runbook

Everything needed to run, change, verify and repair the tool.

## 1. What it is

A static web app that makes one square card per Energy Planning Week 2026 session. It runs entirely in the browser. Nothing is uploaded, nothing is stored on a server, no account is needed.

- Live: https://electrifysimon.github.io/epw-social-card/
- Passcode: `epw`
- Repo: https://github.com/ElectrifySimon/epw-social-card, branch `main`
- Output: PNG, 1080 by 1080, about 1 MB

The card carries the official artwork with the partner logos already in it, the session title, day, time, co-host, a QR to energyplanningweek.info, and an optional badge with the attendee name.

## 2. What it deliberately does not do

- No portrait cut-out, no photo upload. This is a public fork, not a personal card tool.
- No animated export. The drifting artwork never looked settled, so it was pulled on 27 November 2026.
- No speaker names on the card. They sit in the search list only.
- No server, no analytics, no tracking, no cookies beyond `localStorage`.

## 3. Stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript 5.7 |
| Build | Vite 7, base path `/epw-social-card/` |
| Capture | `@zumer/snapdom` 3.8, DOM to PNG in the browser |
| Host | GitHub Pages, Actions workflow on push to `main` |
| Data | `src/data/programme.json`, scraped from the event site |

## 4. File map

```
src/
  App.tsx                  gate switch, preview zoom, export handlers
  modes/SessionCard.tsx    the 1080 card, title fitting, badge logic
  components/Gate.tsx      passcode screen
  components/Rail.tsx      left panel: session, background, name, badge, export
  components/SessionPicker.tsx  search over the programme
  lib/types.ts             EVENT constants, BGS, DIMS, DEFAULT_LABEL
  lib/programme.ts         lookups, day label, co-host line, search
  lib/store.ts             localStorage persistence
  lib/export.ts            snapdom call, download helper
  data/programme.json      37 rows, 21 sessions, 4 days, fingerprint
  assets/bg/bg-1..4.jpg    artwork with logos baked in
  assets/qr-epw.png        QR, white on transparent, 462 square
  styles.css               card grid, per-background variables, rail, gate
scripts/scrape_programme.py  refresh the programme, with a drift check
docs/GUIDE.md                short guide for attendees
.github/workflows/deploy.yml Pages build and deploy
```

## 5. Local loop

```bash
cd ~/projects/epw-social-card
npm install
npm run dev            # http://localhost:5173/epw-social-card/
npm run build          # tsc --noEmit, then vite build
```

`npm run build` fails on any type error. Treat that as the first gate.

## 6. Changing content

### Event constants

`src/lib/types.ts` holds the title, dates, venue, URL and QR label. Screenshot filenames and the gate subtitle read from the same object.

### Programme refresh

```bash
python3 scripts/scrape_programme.py           # rewrite programme.json
python3 scripts/scrape_programme.py --check   # exit 1 if the site changed
```

The script parses the day tables on energyplanningweek.info, splits each cell into title, co-host and speakers, and stores a fingerprint. Run `--check` on a schedule if the organisers keep editing the programme. A changed fingerprint means a human should look at the diff before the next deploy.

`sessions` in `programme.ts` keeps only rows whose kind is `session`, which is what the picker lists.

### Backgrounds

Four official artworks live in `src/assets/bg/`. Each one keeps a different amount of clear space, which drives the layout variables in section 7. If new artwork arrives, re-export it at 1080 square, drop it in as `bg-5.jpg`, add it to `BG` and `SCALE` in `SessionCard.tsx`, add a `BGS` row in `types.ts`, and add a `.card[data-bg='5']` block in `styles.css`.

### QR

The QR is mandatory and points at the event site. It is white on transparent, drawn over the artwork navy. To regenerate:

```bash
~/.venvs/qr/bin/python - <<'PY'
import qrcode
img = qrcode.make("https://energyplanningweek.info/", box_size=14, border=2)
img = img.convert("RGBA")
px = img.load()
for y in range(img.height):
    for x in range(img.width):
        r, g, b, a = px[x, y]
        if (r, g, b) == (0, 0, 0):
            px[x, y] = (255, 255, 255, 255)
        else:
            px[x, y] = (255, 255, 255, 0)
img.save("src/assets/qr-epw.png")
PY
```

Test the result on a dark background, not white. White modules on a transparent field disappear when composited on white, so a decoder will report nothing even though the code is fine. Composite on `#002030`, add a white border, and invert if your decoder still refuses. A phone camera reads it either way.

## 7. The layout grid

The card is 1080 square. Text is positioned by variables set per background, because each artwork blocks a different area.

| Background | `--t` top | `--w` width | `--bmax` bottom limit | `--boxb` badge bottom | `--rhythm` |
|---|---|---|---|---|---|
| 1 | 450 | 588 | 750 | 742 | 14 |
| 2 | 468 | 762 | 820 | 1004 | 20 |
| 3 | 450 | 588 | 898 | 910 | 16 |
| 4 | 296 | 842 | 828 | 980 | 24 |

Left edge is 63 px on backgrounds 1, 3 and 4, and 49 px on background 2. That lines the block up with the "GIZ Campus" line printed on the artwork.

Fixed elements:

- QR: top 36, right 51, width 180, so its box is 838 to 1018 by 36 to 216.
- Badge: right 62, width 340, 2 px border, 16 px radius. Its right edge sits 2 px inside the QR edge, which reads as aligned.
- Body block: `max-height` is `--bmax` minus `--t`. The title has to fit inside that.

Title sizing runs twice. `titleSize()` picks a starting size from the title length and the background. Then a `useLayoutEffect` measures the block and steps the size down one pixel at a time until the block fits its limit, floor 26 px, 24 steps maximum. That measurement is what keeps a three-line co-host clear of the partner banner.

## 8. Export

`App.tsx` renders a second card inside `.export-node`, parked at `left: -4000px`, always 1080 square, never scaled. That node is what gets captured. The visible card in the stage is only a preview.

`cardBlob()` in `src/lib/export.ts` does three things:

1. Waits for `document.fonts.ready`, so a capture never lands on fallback type.
2. Works out the scale from `offsetWidth`, the rendered rect and `devicePixelRatio`. This makes the file exactly 1080 square on any screen, whatever the preview zoom is.
3. Passes `dpr: 1` to snapdom. Without it a retina screen rasterises four times the pixels and a one second export becomes thirty seconds.

The background colour is `#002030`, the artwork navy. That is why no white sliver can appear at the frame edge.

Typical result: 1.0 second, 1080 by 1080, about 1.0 MB, filename `epw2026-<session-slug>.png`.

## 9. Passcode

`Gate.tsx` compares the typed code with `epw`, case insensitive, and stores it in `sessionStorage` for the visit.

This is a courtesy gate, not access control. The check ships inside the JavaScript bundle, and the artwork and the app are public files. Anyone who reads the source can bypass it. It keeps the builder out of casual view, and that is all it claims to do. Say so plainly if someone asks.

To change the code, edit `CODE` in `Gate.tsx` and rebuild. The passphrase is in the repo history too, so treat it as public.

## 10. Deploy

Push to `main`. The workflow `.github/workflows/deploy.yml` runs on Node 22, does `npm ci`, `npm run build`, uploads `dist` and deploys to Pages.

Repository settings that must hold:

- Pages source is **GitHub Actions**, not a branch. `gh api repos/ElectrifySimon/epw-social-card/pages` should report `build_type: workflow`.
- Default branch is `main`. A Pages site created while the default was `master` rejects deploys with "Branch main is not allowed to deploy due to environment protection rules".

After a push:

```bash
gh run list --limit 1 --json conclusion --jq '.[0]'
curl -s https://electrifysimon.github.io/epw-social-card/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
grep -o 'assets/index-[A-Za-z0-9_-]*\.js' dist/index.html
```

The two bundle names must match. If they differ, Pages is serving the previous build.

## 11. Verification checklist

Run this after any layout or export change. Every item below was checked this way before shipping.

1. Gate blocks a fresh session, `epw` opens the builder, a wrong code shows the error line.
2. The picker lists 21 sessions across 4 days.
3. Pick the longest real title, "Regional energy planning, aligning national priorities and regional interconnection", on all four backgrounds.
4. Measure the title, time and co-host boxes against `--bmax`. Nothing may cross it.
5. Hit test the body boxes against the badge box. No overlap is allowed.
6. Export the PNG. Confirm 1080 by 1080 in a real image library, not by eye.
7. Read row 0 of the export. It must be navy, with no bright pixels.
8. Decode the QR from the exported PNG with `cv2.QRCodeDetector`. It must return `https://energyplanningweek.info/`.
9. Reload and confirm the name, badge text and background came back from `localStorage`.

A small script covers steps 6 to 8:

```python
from PIL import Image
import numpy as np, cv2
im = Image.open("card.png").convert("RGB"); a = np.asarray(im)
print(im.size, a[0].mean(axis=0).round(1))         # expect (1080, 1080) and navy
crop = a[0:230, 830:1030][:, :, ::-1]
print(cv2.QRCodeDetector().detectAndDecode(crop)[0])
```

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Light line along the top of the PNG | capture started a fraction above the artwork, page ground was white | page background set to `#002030`, artwork inset `-4px`, capture background navy |
| PNG comes out 976 or 1036 wide | preview zoom and device pixel ratio leaked into the capture | export the off-screen `.export-node`, scale computed from `offsetWidth` |
| Export takes 30 to 90 seconds | snapdom rasterising at retina size | `dpr: 1` in the snapdom call |
| Download never appears although the button says done | browser drops a blob download fired long after the click | export now finishes in about a second, so the click is still live; if it regresses, show a link instead of calling `download()` |
| Co-host line runs into the partner banner | long co-host plus a long title | raise `--t`, keep `--w` clear of the badge, and let the auto-fit loop shrink the title |
| Wrong weekday on the card | hand-built weekday table | `dayLabel()` builds a real `Date` for December 2026 |
| Blank page under the Pages subpath | `base` in `vite.config.ts` missing or wrong | must be `/epw-social-card/` |
| Deploy fails on branch protection | Pages created while default branch was `master` | set default branch to `main`, delete and recreate Pages with `build_type: workflow` |
| Fonts fall back to system type in the export | capture fired before fonts loaded | `await document.fonts.ready` at the top of `cardBlob` |

## 13. Maintenance

- **Programme drift.** Run `python3 scripts/scrape_programme.py --check` weekly until the event. A non-zero exit means the site changed.
- **Dead weight in the bundle.** `echarts`, `motion`, `gifenc` and `src/gifenc.d.ts` are leftovers from earlier experiments and can be removed. Five fonts (bebas, dmserif, oswald, playfair, space-grotesk) are no longer referenced. Only Archivo and Inter are used. Removing them is safe and cuts the bundle.
- **Search engines.** No `noindex` tag is set. Add one to `index.html` if the builder should stay out of results.
- **QR quiet zone.** The current scrim is a soft navy vignette. The visual review suggested a slightly wider quiet zone for older scanners. Untested on print.
- **Artwork source.** Originals live in `Drop\in\epw-social` on Simon's machine, as SVG plus JPG. Keep the SVGs, they are the master.

## 14. Handover

The repo is public and the site is static. To move it, fork it, set `base` in `vite.config.ts` to the new path, enable Pages with the Actions source, and change `CODE` in `Gate.tsx`. There is nothing else to migrate: no database, no secrets, no server.
