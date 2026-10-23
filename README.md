<div align="center">

<img src="docs/media/under-construction.png" alt="Under construction – hard hats on, please" width="100%" />

<a href="docs/media/homeorg.mp4"><img src="docs/media/homeorg.gif" alt="Homeorg<3 in 20 seconds: tick off a chore, earn coins, draw pixel furniture and pets, feed Mochi" width="100%" /></a>

<sub>▶ Watch with sound: <a href="docs/media/homeorg.mp4">homeorg.mp4</a></sub>

# Homeorg<3

**Chores, cooking, pets – and a little pixel home that gets cosier as you go.**

![Android](https://img.shields.io/badge/Android-APK-6FCDA8?style=flat-square&logo=android&logoColor=white)
![iPhone](https://img.shields.io/badge/iPhone-sideload-B48CF0?style=flat-square&logo=apple&logoColor=white)
![Local](https://img.shields.io/badge/data-stays_on_your_phone-FF79B0?style=flat-square)
![No account](https://img.shields.io/badge/account-none-FFC24D?style=flat-square)
![In-app purchases](https://img.shields.io/badge/in--app_purchases-never-E2508F?style=flat-square)

</div>

> [!WARNING]
> **🚧 Under construction.** Homeorg<3 is in the middle of a big makeover: pixel
> rooms, pets, an iPhone build. It already runs every day on real phones, but
> things may change, wobble or briefly break. Make a backup now and then
> (*Settings → Export data*).

---

## ✨ What's inside

|  |  |
| --- | --- |
| 🧽 **Chores without pressure** | Every chore has its own rhythm. *Today* only fills your day up to your time budget – easy wins first, so you get going. |
| 🪙 **Coins for everything** | Cleaning, cooking, putting the shopping away, looking after your pets, checking in: it all earns coins, with a daily cap per kind. |
| 🏠 **Your pixel home** | Every room is a little pixel picture with the wallpaper and floor you pick. Furniture and decor are stickers: drag, turn, mirror and stack them anywhere. |
| 🎰 **Sticker machine** | About 2,600 pixel pieces in 27 sets; each month three furniture sets and one pet set are in the machine. Every draw is new. **No in-app purchases. Ever.** |
| 🐈 **Pet mode** | Cat, dog, bird, fish, hamster, gecko…: one tap for food, water, the litter box, a walk or a water change, plus supplies that tell you how many days they'll last. |
| 🍳 **Kitchen** | Recipe book, "Let's cook it", a pantry with best-before dates, a shopping list. REWE orders and receipts put themselves away. |
| 🔖 **Don't forget this** | What needs throwing out, what's about to go off, an empty fridge, cat litter running low – in one place, a nudge rather than a nag. |
| 💗 **How do you feel?** | A quick check-in. On hard days you get kind words and fewer chores, never more – and, with a pet, a suggestion to cuddle. |
| 🌸 **Kawaii** | Blush paper, ivy, fairy lights, stickers with faces, pixel splashes. Five more colour schemes, from Classic to Midnight. |

## 📸 A look around

<div align="center">
<table>
  <tr>
    <td><img src="docs/media/screen-home.png" width="200" alt="Home" /></td>
    <td><img src="docs/media/screen-room.png" width="200" alt="A room" /></td>
    <td><img src="docs/media/screen-shop.png" width="200" alt="Sticker machine" /></td>
    <td><img src="docs/media/screen-pets.png" width="200" alt="Pets" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Home</sub></td>
    <td align="center"><sub>A room</sub></td>
    <td align="center"><sub>Sticker machine</sub></td>
    <td align="center"><sub>Pets</sub></td>
  </tr>
</table>
</div>

## 📲 Install

**Android:** download the APK from [Releases](../../releases) to your phone,
tap it and allow "install from unknown sources". Runs on any 64-bit Android
(roughly 2017 and newer).

**iPhone:** no App Store, it's a sideload. Install the `.ipa` from Releases with
SideStore, AltStore or Sideloadly and your own Apple ID. Needs iOS 16.4 or
newer. The details are [below](#iphone-sideloading).

**Just have a look:** `npm install && npm run web` opens the app in a browser
(no camera, no haptics).

## 🔒 Private, honestly

Everything lives on your phone. No account, no server, no sync, no ads, no
analytics. The only network call is the optional barcode lookup at Open Food
Facts, and it sends nothing but the number on the box. PDFs and photos are read
on the device and never uploaded.

---

## 🛠️ For developers

Anyone working on the code – person or AI agent – reads [AGENTS.md](AGENTS.md) first.

<details>
<summary><b>Run, test, build</b></summary>

```bash
npm install
npx expo start          # scan the QR code with Expo Go (same Wi-Fi, or --tunnel)
npm run web             # in the browser
npm run tsc             # typecheck
npm test                # REWE, shelf life, GS1, printed dates, stickers, streaks, check-ins, pets
npm run apk             # local release APK (JDK 21 + Android SDK 36)
```

### Build the APK yourself

Runs entirely on your own machine – no Expo account, nothing uploaded.
`scripts/build-apk.js` finds the JDK and SDK by itself. `npm run apk` generates
the native project, adds the signing key and builds; the file lands in
`android/app/build/outputs/apk/release/app-release.apk`.

It builds for **arm64-v8a** only; for an old 32-bit device run
`TIDYWELL_ABIS=armeabi-v7a,arm64-v8a npm run apk` once. The first build
downloads about 1.6 GB of Gradle dependencies and takes a quarter of an hour;
after that, a minute or so.

**The signing key lives in `credentials/` and never goes into git.** Without it
an installed copy can't be updated. `npx expo prebuild` rewrites `android/`
from scratch; `scripts/sign-android.js` puts the signing back, and `npm run apk`
does that for you.

### Let GitHub build it

Push a tag like `v1.3.0`: the *Release* workflow builds the APK and the IPA and
attaches both to a GitHub release. *Actions → Release → Run workflow* builds
without releasing, for Android, iOS or both. Signing the APK with your own key
needs four repository secrets – see [AGENTS.md](AGENTS.md#git-and-releases).

### iPhone (sideloading)

The workflow builds an **unsigned IPA** on a free macOS machine from GitHub, so
no Mac of your own is needed. It's signed with your Apple ID when you install it:

1. Download the IPA (from a release or as a workflow artifact).
2. Install it with **SideStore**, **AltStore** or **Sideloadly**.
3. On the iPhone, turn on *Settings → Privacy & Security → Developer Mode* and
   trust the developer under *General → VPN & Device Management*.

With a **free Apple ID** the app runs for 7 days and then needs refreshing
(SideStore and AltStore do it over Wi-Fi), and you can have at most 3 sideloaded
apps. With the **Apple Developer Program** ($99/year) the signature lasts a year.
Your data survives a refresh. Reminders are local notifications; the push
entitlement, which a free Apple ID can't sign, is removed by the workflow.
iOS 16.4 or newer.

### EAS

`eas.json` is there if you'd rather build in Expo's cloud
(`eas build -p android --profile preview`). That needs an Expo account, and the
project – music included – goes to their servers.

</details>

<details>
<summary><b>How it works</b></summary>

**Cleanliness** Every chore has a frequency. It runs from 100 % (just cleaned)
down to 0 % (one full cycle gone), worked out fresh every time you open the
app. Months are real months: 31 January + 1 month = 28 February.

**Order** How overdue and how easy. Overdue counts for more, but easy chores get
a bonus: five small wins build the energy for the big one. At some point
"overdue" stops growing.

**Room percentage** An average weighted by minutes. A clean mirror doesn't save
a dirty floor.

**Today** A time budget per day (30 minutes by default), filled with what's most
urgent; the rest waits under "Got more time?". Ticked chores count against the
budget, so the day can actually end.

**Coins and streaks** Coins for chores (3/5/10 by effort) and almost everything
else, with a daily cap per source (`src/lib/rewards.ts`). Streaks count any
active day at the rhythm you choose (daily, every 2–3 days, weekly), with grace days.

**Rooms** Every room is a pixel picture in a 3/4 top-down view: wallpaper and
floor from LPC tiles (about 250 wallpapers and 150 floors, each with a pink
version), with stickers on top. New rooms come with a few fitting pixel pieces.

**Sticker machine** Every draw is a piece you don't have yet, from this month's
sets. It picks the set first, then the piece by rarity.

**Pets** Care taps for each kind of animal (`src/lib/pets.ts`); a second tap
within ten minutes takes the first one back. Supplies run down by their daily
use and give you a nudge five days before they run out.

**Kitchen** *Recipes* is a collection, not a weekly plan. Homeorg<3 checks it
against the pantry: what you could cook right now, what's missing one or two
things. "Cooked it" uses up the ingredients; the shopping button only adds
what's missing to the list.

**Music** Starts in Focus and during sprints and keeps playing in the background.

</details>

<details>
<summary><b>Barcodes, REWE, best-before dates</b></summary>

**Scan a barcode** In the pantry: point the camera at it, and the name and pack
size come from [Open Food Facts](https://world.openfoodfacts.org). This is the
only place the app goes online; switch it off under *Settings → Look barcodes up online*.

**Put a REWE order away** Pick the pickup/delivery PDF or the **eBon** (till
receipt); the app reads it on the phone. It counts what was delivered:
substitutes come in as what was really in the bag, loose produce with its real
weight. Till abbreviations like `KRAEUT.SEITL.BIO` become "Kräuterseitlinge bio".
`npm run test:rewe` checks against real (anonymised) orders in `scripts/fixtures/`.

**Best-before dates** Everything in the pantry gets one: from the label (**Scan
date** reads it with the camera, using Google ML Kit – MHD, SKT, 賞味期限,
有效日期, 유통기한…), from the QR or DataMatrix code (GS1), or estimated by where
it's kept – our own table first, then USDA FoodKeeper (CC0), then Open Food Facts
categories. Estimated dates show with a "≈". Text recognition is native: it works
in the APK, not in Expo Go or the browser.

</details>

<details>
<summary><b>Project layout</b></summary>

```
app/                 screens (expo-router, one file per route)
  (tabs)/            Home, History, Today, My Home, Profile
  room/ task/ challenge/ decorate/ recipe/
  kitchen.tsx cook.tsx recipes.tsx shopping.tsx   the kitchen
  pets.tsx           pets and their supplies
  shop.tsx           the sticker machine
  scan.tsx import.tsx barcode scanner, REWE import
src/
  lib/               pure logic: planning, dates, PDF, REWE, stickers, pets, reminders
  state/             the store (zustand + AsyncStorage), derived values
  data/              room types, sticker catalog, walls and floors, challenges, units
  ui/                building blocks, RoomCanvas, StickerLayer, decor, pixel splashes
assets/stickers/     pixel stickers (generated)
assets/surfaces/     wallpapers and floors (generated)
assets/music/        the music
scripts/
  build-stickers.py  cut stickers from the LPC sheets, render the pets
  build-surfaces.py  cut wallpapers and floors
  pets/              the hand-drawn pets (templates, coats, species)
  build-apk.js sign-android.js  build and sign the APK
```

Rebuild the stickers: `python3 scripts/build-stickers.py` (needs Pillow);
walls and floors: `python3 scripts/build-surfaces.py`;
music: `TIDYWELL_MUSIC_SRC="D:/path/to/Music" npm run music`.

</details>

<details>
<summary><b>Backups</b></summary>

**Settings → Export data** writes everything into one file,
`homeorg-backup-YYYY-MM-DD.json`, and opens the share sheet. **Import data**
reads such a file back and replaces everything on the phone (it asks first).
Before/after photos stay on the device. The file carries a format version, so
later versions of the app can read older backups.

</details>

<details>
<summary><b>What's missing (on purpose)</b></summary>

Homeorg<3 started as a local-only take on the tidywell-app.com app, leaving out
everything that needs a server:

- sharing a household, members, roles, kids mode
- live sprints with others (solo sprints are in)
- photo sync between devices

Breaking chores into steps runs on rules, on the device. Everything is unlocked –
a subscription without a server would make no sense.

</details>

## 💗 Credits

- **Pixel furniture, walls and floors:** [LPC Revised](https://github.com/ElizaWy/LPC)
  (CC-BY 3.0 / OGA-BY 3.0); the artists for each set are on the About screen and
  in `assets/stickers/CREDITS.md`.
- **Pets:** drawn for this app (`scripts/pets/`).
- **Product data:** [Open Food Facts](https://world.openfoodfacts.org) (ODbL).
  **Shelf life:** USDA FoodKeeper (CC0).
- **Music:** from the owner's own library, re-encoded. The NCS tracks are cleared
  for this kind of use; the game soundtracks usually aren't – before a store
  release the music would need to go or be swapped for royalty-free tracks.
- **The video at the top** was made with [/brag](https://github.com/latent-spaces/brag);
  its soundtrack was generated for it.
