# Social cards

A single static page that turns a few fields into a post ready image at exact platform pixels. No account, no server, no upload. Photos and QR codes stay in the browser.

Live at https://electrifysimon.github.io/social-cards/

## 🎴 The three cards

| Mode | Use it for | Main field |
|---|---|---|
| Event | You speaking, a session, a panel | Headline, date, venue, portrait |
| Number | One figure that carries the argument | Value, unit, takeaway |
| Story chart | A trend with a shape | CSV, chart type, callouts |

Format is 4:5 portrait (1080 by 1350) or 1:1 square (1080 by 1080).

## ⌨️ Filling a card

Every control sits in the rail on the left. Text fields write straight onto the card, and the card redraws as you type.

| Field | What it does |
|---|---|
| Mode | Switches the card layout |
| Format | 4:5 or 1:1 |
| Kicker | The small line above the headline |
| Headline | The card's main statement, wraps to four lines |
| Sub | One supporting sentence |
| Date | Sits top right on an event card |
| Who, Where | The byline block at the foot |
| Value, Unit, Takeaway | Number card only |
| CSV, Chart type, Callouts | Story chart only |

## 🎨 Look

Palettes set accent and ground together. Either one can then be overridden, so a palette is a starting point you can leave behind.

Seventeen background effects plus Flat, all drawn on a canvas from the timeline value. That means the preview and the GIF frames are the same picture, and every effect animates in both.

Nine typefaces, self hosted: Space Grotesk, Inter, Archivo, Oswald, Bebas Neue, DM Serif Display, Playfair Display, a system stack, and a mono stack.

## 🧍 The portrait

Upload a cut out PNG or WebP with a transparent background. Nothing leaves the browser and no ground is painted behind the subject: colour grading, the rim light and the shadow are all CSS, so the artwork runs underneath.

Position left, right or none. Size runs from 38 to 92 percent of the card width, capped lower on the left so the headline keeps its column.

Cropping of the built in portrait stops at the microphone line, with the last 90 pixels fading out. A photo swap keeps that treatment only if you cut it the same way; upload your own cut out for a different shot.

## 🔳 The QR code

Off by default. A slot appears under the date the moment you upload one.

Upload a white QR on transparency and it passes through untouched. Upload a black QR on a white square and the file is converted on the way in: modules become white, the paper becomes transparent, so it sits on the artwork instead of punching a hole in it.

White on dark is inverted against the QR spec. Phone cameras read it. Some handheld and flatbed scanners do not, so test with the reader that will be used before you print it.

## 📤 Export

| Output | Size | Notes |
|---|---|---|
| Download | 1080 by 1350 or 1080 by 1080 | About 1.5 MB, export takes a second |
| Copy PNG | Same | Straight to the clipboard for pasting into a post |
| Animated GIF | Same pixels | 32 frames at 50 ms, then a 2 second hold on the finished card |

Encoding a GIF takes about 16 seconds and lands around 4 MB. That 2 second hold at the end stops the loop snapping back to the empty frame, which is what makes a short loop tiring to look at.

## ♿ What the build guarantees

Contrast is computed, not eyeballed. Card text colours are derived from the ground's luminance, so a light ground gets dark type and a dark ground gets light type. An accent used as text falls back to ink when it fails 3 to 1 against the ground.

Its own accent keeps the rail readable whatever colour the card is using, so a selected button never disappears.

Measurement runs on every text node against the pixels actually behind it: 9,101 checks across two UI themes, seven grounds, five accents and three card modes, with zero failures.

## 🛠️ Build

```bash
npm install
npm run dev      # http://localhost:5173/social-cards/
npm run build    # dist/, ready for Pages
```

Deploy is a push to `main`. A Pages workflow builds and publishes `dist`.

## 🧾 Licences

MIT and Apache 2.0 only. Export uses snapdom (MIT), the GIF encoder is gifenc (MIT), charts are Apache ECharts (Apache 2.0), and fonts are self hosted under the SIL Open Font Licence. No AGPL, no GPL.

## 🔧 When something looks wrong

| Symptom | Cause |
|---|---|
| Export comes out twice the size | Device pixel ratio is being applied twice; export divides by `devicePixelRatio` |
| Typeface control changes nothing | A later CSS shorthand is winning over the font variable |
| Selected button text vanishes | The rail accent is being read from the card instead of its own variable |
| White square around the QR | The uploaded image was not normalised; check `src/lib/qr.ts` |
| Pale type on a light ground | The ground luminance cut is at 0.42 in `src/lib/theme.ts` |
