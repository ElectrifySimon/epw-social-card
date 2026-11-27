# EPW session cards, guide

A one page tool for Energy Planning Week 2026. Pick the session you are attending, pick one of the four backgrounds, download the card.

Live: https://electrifysimon.github.io/epw-social-card/ with the passcode `epw`.

## 🚪 The passcode

The gate is client side: `epw` is checked in the browser and remembered for the visit in session storage. It keeps the builder out of casual reach. It is not access control, because the files behind it are public and the code sits in the JavaScript bundle. If the cards must be closed to the public, the check has to move to a server.

## 🎫 Choosing a session

The list holds 21 sessions across the four days, pulled from the participant portal. Search by title, speaker, co-host or day. Breaks and logistics are filtered out, so every entry is something worth announcing.

The card shows the session number, the day and date, the day theme, the title, the time, the co-hosting partner and up to three speakers with a count for the rest.

## 🖼️ Backgrounds

Four artworks, named 1 to 4, exactly as supplied:

| Background | What it carries |
|---|---|
| 1 | Event title top left, white partner banner in the lower third |
| 2 | Event title top left, open ground below |
| 3 | Event title top left, partner banner on the bottom edge |
| 4 | Line artwork only |

The session text sits in the clear band the organisers left between the title block and the partner banner. That band is 348 pixels tall on a 1080 card, which is why the title steps down from 48 to 34 pixels as it gets longer. A 121 character session title still fits three lines.

Slow drift on the artwork is on by default. Turn it off for a still frame; the GIF then records a single pose.

## 🔳 The QR code

Always on, top right, pointing at the participant portal. It sits on a quiet zone painted in the artwork's own navy, so it scans without a white card pasted on the design. Drawn white on transparency, which every phone camera reads.

## 📤 Export

Download PNG writes 1080 by 1080, about 0.9 MB. Animated GIF writes 29 frames at 60 ms with a two second hold on the finished frame, about 3 MB, and takes six seconds to encode.

The GIF arrives as a Save button instead of a silent download, because a browser drops a download fired a minute after the click that started it. One extra click, and it always lands.

Your name is optional. Fill it in and the card carries an Attending line; leave it empty for a clean card.

## 🔄 Refreshing the programme

The programme is scraped at build time, never fetched by the attendee's browser.

```bash
python3 scripts/scrape_programme.py          # rewrite src/data/programme.json
python3 scripts/scrape_programme.py --check  # exit 1 when the live programme moved
```

Each of the four day tables is read as time, bold title, optional co-host line, speaker list. A fingerprint of the titles, times, co-hosts and speakers is stored with the JSON, so a changed programme shows a different hash and cannot ship silently.

## 🏗️ Build and deploy

```bash
npm install
npm run dev      # http://localhost:5173/epw-social-card/
npm run build    # dist/
```

Any push to `main` builds and publishes through the Pages workflow. The app lives under `/epw-social-card/`, which is set in `vite.config.ts`.

## ⚠️ Known limits

The venue line is not on the card, because the portal publishes one venue for the week and no per-session rooms.

Background 3 puts the partner banner on the bottom edge of the artwork, so the banner has no breathing room below it. That comes from the artwork, not the card.

White on dark QR codes are inverted against the spec. Phones read them. Old handheld scanners may not.

## 🧾 Credits

Artwork, event title and partner marks belong to the organisers and are used unchanged. Built from the social-cards tool: React 19, Vite, SnapDOM, gifenc, self hosted fonts.
