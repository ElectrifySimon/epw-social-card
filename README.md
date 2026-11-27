# EPW 2026 session cards

A card builder for Energy Planning Week 2026. Pick the session you are attending, pick one of the four backgrounds, download the PNG.

Live: https://electrifysimon.github.io/epw-social-card/ with the passcode `epw`.

## What it does

- 21 sessions pulled from https://energyplanningweek.info/, grouped by day, searchable by title, speaker or day.
- Four backgrounds, named Background 1 to 4, each with the partner lockup already in the artwork.
- A QR to the participant portal on every card, in the artwork's own navy so it scans without a white patch.
- Optional name line, so the card reads as yours without a photo.
- PNG at 1080 by 1080, about 1 MB.

## Run

```bash
npm install
npm run dev      # http://localhost:5173/epw-social-card/
npm run build
```

## Refresh the programme

```bash
python3 scripts/scrape_programme.py          # rewrite src/data/programme.json
python3 scripts/scrape_programme.py --check  # exit 1 when the live programme changed
```

The scraper reads the four day tables on the portal. Each row is a time, a bold title, an optional co-host line and a speaker list, so nothing is guessed. A fingerprint of the programme is stored beside the JSON: when a title, time or speaker moves, the next build shows a different hash.

## Passcode

The gate is client side and stores `epw` in session storage. It keeps the builder out of casual reach, it is not access control: the static files are public and the code is in the bundle. Move to a server check if the cards must be closed to the public.

## Credits

Backgrounds, event title and partner marks are the organisers' artwork, used unchanged. Built from the social-cards tool: React 19, Vite, SnapDOM, gifenc, self hosted fonts.
