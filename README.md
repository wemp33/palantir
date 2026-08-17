# Palantir

A private memory for the people you know.

You meet someone, they tell you their sister just had a baby, that they start at a
new firm in October, that the dog is called Fistaszek — and three weeks later it's
gone. Palantir is where that goes. Say or type everything you picked up today in one
blob, and it gets filed into the right person's profile: birthdays, pets, jobs past
and present, where they live, where they grew up, what they've pulled off.

Everything stays on your phone. There is no account and no server.

**Live:** https://wemp33.github.io/palantir/

---

## What it does

- **One box for the whole day.** Type it or dictate it — "Ania is moving to Warsaw,
  Tomek got a beagle" — and Claude splits it into people, matches them against the
  profiles you already have, and proposes the changes. Nothing is written until you
  tap Apply, and you can untick any single field or fact first.
- **Photos too.** Attach photos to the note; they're sent with it, and you can move
  each one to whichever person it belongs to on the review screen. The first photo
  a person gets becomes their portrait.
- **Profiles.** Name and nicknames, category, birthday, where they live, the family
  home, current and former jobs, where they studied, pets, achievements, family and
  partners, interests, contact, notes — plus a running list of small things you've
  learned, each dated.
- **A crown for the people who matter.** Tap it and it turns gold; they float to the
  top of every list and get their own filter, on the list and on the map.
- **Maps.** Every address you've written down — homes, family homes, workplaces,
  old workplaces, universities — on one map, each pin wearing the person's face.
  Filter it by group (that's the map for each group), by crown, or by kind of place.
  Every profile has its own map of just that person. Tap a pin for the place, the
  person and a link out to full maps. Addresses are looked up once and remembered,
  so it opens instantly afterwards; anything that can't be found you can place by
  hand with one tap.
- **Categories.** Family, friends, college, high school, primary school, business,
  other — and any of your own.
- **Birthdays.** The home screen shows whose is coming up in the next six weeks and
  what age they're turning.
- **Search** runs across every field and every fact, not just names.
- **Passcode.** Four digits on an in-app keypad; the app re-locks after three
  minutes in the background. Default is `3671` — change it in Settings.
- **Three languages.** English, Polish and Hebrew, with right-to-left layout for
  Hebrew.

## Installing it on an iPhone

Open the link in Safari → Share → **Add to Home Screen**. It runs full-screen and
works offline; only the AI sorting needs a connection.

## The AI part

Sorting is optional and off until you provide a key. In **Settings → AI sorting**,
paste a Claude API key from [console.anthropic.com](https://console.anthropic.com)
and pick a model (Opus 5 by default; Sonnet 5 and Haiku 4.5 are cheaper). The key is
stored in this device's IndexedDB and is sent to `api.anthropic.com` only when you
tap *Sort into profiles* — the request goes straight from your browser to Anthropic
and touches nothing else.

Without a key everything else still works: add and edit people by hand, and write
facts as you learn them.

## The map

There's no mapping library. The tile layer is a few hundred lines that lay out
OpenStreetMap raster tiles by hand and invert them with a CSS filter so the map
sits in the app's own dark palette; the pins are ordinary DOM on top. Pan, pinch,
double-tap and the zoom buttons all work.

Addresses become coordinates through [Nominatim](https://nominatim.openstreetmap.org),
one lookup at a time with a second between them, as its usage policy asks. Every
answer is stored, keyed by the address, so each place is looked up exactly once
ever — and shared between people who live on the same street. Coordinates you set
by hand always win over a lookup, and they travel in the backup.

Offline the pins still sit where they belong; only the tiles need a connection.

## Where the data lives

IndexedDB, in this browser, on this device. Photos are downscaled to 1600px and
stored as JPEGs. Nothing is uploaded, synced or backed up automatically — so:

**Settings → Export a backup** writes a single JSON file with every profile, fact
and photo. Keep one somewhere safe. Clearing the browser's site data, or deleting
the app from the Home Screen, erases everything.

## Building the icons

The mark — a ring above a chevron cradle — is drawn as geometry, not a font or an
image file, so every size renders exactly:

```bash
node tools/gen-icons.mjs
```

## Layout

```
index.html              the whole app: markup, styles, logic
manifest.webmanifest    PWA manifest
sw.js                   offline shell (bump CACHE on release)
icons/                  generated PNGs + favicon.svg
tools/gen-icons.mjs     icon generator, no dependencies
```

No build step, no bundler, no dependencies. Serve the folder and it runs.
