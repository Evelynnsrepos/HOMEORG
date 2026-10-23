# Working on Homeorg<3

Guidelines for anyone — person or coding agent — changing this app. Read this
before the code; it explains the rules the code quietly follows.

## What this is

A household, cleaning and kitchen planner for Android and iOS, built with Expo
(SDK 57), React Native, expo-router and zustand. **Everything lives on the
phone.** No account, no server, no sync. The one network call the app may make
is the optional barcode lookup in `app/scan.tsx`, and it is behind a setting.

The look is **kawaii pink**: blush paper, white cards, bubblegum accents, ivy
vines, warm Edison bulbs and stickers with faces. The layouts follow the
owner's design sketches; when in doubt, match the sketch over your own taste.

## Commands

```bash
npm ci                 # install
npx expo start         # dev server, scan the QR code with Expo Go
npm run web            # quick look in a browser (no camera, no haptics)
npm run tsc            # typecheck — must pass
npm test               # REWE, shelf life, GS1, printed dates, stickers, streaks, check-ins — must pass
npm run apk            # local release APK (needs JDK 21 + Android SDK 36)
```

There is no linter and no other test suite. "Done" means `tsc` and
`npm test` pass **and** you looked at the screen you changed (see
[Checking your work](#checking-your-work)).

## Where things are

| Path | What |
| --- | --- |
| `app/` | Screens, one file per route (expo-router). `(tabs)/` is the bottom bar. |
| `app/(tabs)/_layout.tsx` | The tab bar: Home, History, Kitchen, My Home, Profile. Kitchen pushes `/kitchen`; Today is a hidden tab opened from Home. |
| `src/state/store.ts` | The one zustand store, persisted to AsyncStorage. All writes go through its actions. |
| `src/state/derived.ts` | Hooks that compute from the store (health, streaks, stats). |
| `src/lib/` | Pure logic, no React: dates, the chore engine, kitchen matching, PDF reading, the REWE parsers, `hype.ts` for History. |
| `src/data/` | Static tables: room types, shop items, challenges, units. |
| `src/ui/base.tsx` | Building blocks: `T`, `Card`, `Row`, `Btn`, `Chip`, `Ring`, `Bar`, `Screen`… use these, don't restyle from scratch. |
| `src/ui/Art.tsx` | Traced sketch art: `EffortRing`, `FridgeGauge`, `RecipeBookArt`. |
| `src/ui/Decor.tsx` | `Garland`/`ScreenGarland` (vines + bulbs) and the kawaii `Sticker` decorations. |
| `src/ui/StickerLayer.tsx` | Draws a room's placed stickers; `PieceImage` draws one piece. |
| `src/ui/Kitchen.tsx` | Kitchen pieces: effort meter, `PickTile`, `packRows`, `DaySheet`. |
| `src/theme.ts` | Colour schemes, radii, fonts, shadows. |
| `scripts/` | APK build, signing, icons, music, the REWE test and its fixtures. |

## Rules

### Local-first, always
- No new network calls, analytics, crash reporters or cloud anything.
- Files the user picks (PDFs, photos) are read on the device and never uploaded.
- New dependencies need a reason. Prefer a few lines of our own code (the PDF
  reader, MD5 and RC4 in `src/lib/crypt.ts` are examples) over a package.

### The store
- Add state to `State`, `initialState` and an action in `Actions`; screens
  call actions, never `setState` directly.
- **Old phones have old data.** A new field must be optional or default to
  something sensible when it's missing (`s.cookLog ?? []`). Persisted
  `settings` are replaced wholesale on load, so new settings are optional and
  read with `!!` or `??`.
- Renaming or reshaping persisted data needs a `version` bump and a step in
  `migrate` (see the v1 → v2 recipe migration).
- Backups (`src/lib/backup.ts`) take the whole state, so new fields ride along.

### The look
- There are several colour schemes (Kawaii, Classic, Dracula, Matcha,
  Lavender, Midnight), picked in Settings and stored as `settings.theme`.
  Kawaii is the default. A new scheme is one entry in `themes` in
  `src/theme.ts` with every `Palette` key filled — check it on a dark *and* a
  light screen.
- Colours come from `colors` in `src/theme.ts`, which holds the active scheme.
  **Read `colors.x` while rendering, never at module load** (no
  `const X = colors.coral` at the top of a file, no colours in a module-level
  style object): switching scheme copies the new palette in and remounts the
  app, so anything captured earlier keeps the old colour. Use getters if a
  module-level table needs colours (see `bandColor`).
- The token names are older than the schemes: **`coral` is the main accent,
  `sage` is "done"**. Don't hard-code a hex that a token already covers — it
  will look wrong in Dracula or Midnight.
- The palette has no alarm red. Overdue is a warm peach (`needsLove`,
  `needsYou`) — the app never scolds.
- Decorate with `ScreenGarland` at the top of tab screens and the odd
  `Sticker` on a card corner (absolute, small negative offset, slight tilt).
  Keep it to one or two stickers per screen; they're seasoning. They follow
  the scheme (stickers are coloured from its palette) and two switches in
  Settings (`showVines`, `showStickers`; unset = the scheme's `decor`
  default, off in Classic). Lay screens out to work without them.
- Art traced from the sketches stays in the sketches' flat shape language: a
  few solid shapes, no added detail lines, textures or inner shadows.
- Two fonts: Bricolage Grotesque for everything, and the handwritten
  **Dancing Script** only through `ScriptTitle` (`src/ui/Script.tsx`) in a
  few hand-picked spots — the "Let's cook it" banner, the recipe book title
  and the word over the fridge gauge. It sits on a slanted, stepped line and
  may spill over card edges on purpose; give its neighbours room rather than
  straightening it. Don't spread it to body text or buttons.
- Effort is always the rainbow `EffortRing` (1 = a third, 3 = full circle),
  never dots or stars.
- Everything decorative is SVG drawn in code. If real sticker PNGs are added
  (e.g. Flaticon's kawaii pack by barnstudio), put them in `assets/stickers/`
  and add the attribution the licence asks for to `app/about.tsx`.

### Words
- UI copy is **English** (the README is German). Warm, short, encouraging,
  second person. Sentence case for titles.
- History in particular is a hype screen: only what you did, never what you
  missed.

### Code style
- TypeScript strict; `npm run tsc` clean, no `any` unless there's no way round.
- Comments explain *why*, in plain sentences, at the top of a component or a
  tricky block — match the density of the file you're in.
- Keep logic that can be pure in `src/lib/` so it can be tested with `tsx`.
- Small, focused edits beat rewrites. Don't reformat code you aren't changing.

## Rooms, stickers and coins

**Rooms are decorated with stickers** (`room.stickers`, `src/lib/stickers.ts`):
a piece id, a centre as a fraction of the room picture, a width as a
fraction of its width, a rotation, a mirror flag and a layer. Pieces are
pixel art from `src/data/stickerCatalog.ts` or the original drawn furniture
(`svg:<shop item id>`). The editor (`app/decorate/[id].tsx`) drags, pinches,
twists, and has buttons for the same. Old slot layouts were moved to stickers
once on load; `room.decor` is only history now.

**The sticker library** is generated: `python3 scripts/build-stickers.py`
(needs Pillow) cuts the LPC Revised sheets in `scripts/data/lpc-revised/`
(CC-BY 3.0 / OGA-BY 3.0) into ~2500 pieces in 21 sets of about 80–160 (ids come from the source sheet, so sets can be reshuffled without touching anyone's collection), writes
`assets/stickers/` and `src/data/stickerCatalog.ts`, and the credits to
`assets/stickers/CREDITS.md`. The artists are listed on the About screen —
that attribution is required, keep it.

**The sticker draw** (`app/shop.tsx`) is the only place coins are spent:
every draw is a piece you don't own yet, from this month's three sets
(`featuredSets`, they rotate on the 1st), set first then piece by rarity.
**There are no in-app purchases and never will be.**

**Coins** come from almost everything, through the store's `earn(source)`
with a daily cap per source (`src/lib/rewards.ts`) so nothing can be farmed.
New ways to earn go there, with a cap, and on the list in `app/shop.tsx`.

**Streaks** (`src/lib/streak.ts`) count any active day — chores, anything
that earned coins, a check-in — at the rhythm the person chose
(`streakEvery`), with grace days (`streakGrace`) before it breaks, and a week
streak for weeks with `weekGoal` active days. Keep them forgiving.

## Check-ins and data

The Home tile and `app/mood.tsx` record how someone feels (`moods`: mood,
room for other people, energy to clean, energy for hobbies, 0-100; presets
fill all four). A hard day (`isHardDay` in `src/lib/mood.ts`) opens the
comfort sheet (`src/ui/Comfort.tsx`): affirmations, suggestions that only
ever mean doing *less*, and a pointer to TelefonSeelsorge. Never answer a low
check-in with more tasks, guilt or streak warnings. `app/mood-data.tsx`
draws it all: a contribution-style grid, the last 30 days, gentle patterns.
This data never leaves the phone.

## The kitchen in one paragraph

Recipes live in the book (`recipes`). "Let's cook it" shows **picks**
(`mealPlan`): dishes you chose for the next days. A pick's `day` is optional —
weekday planning is a switch (`settings.cookByDay`), off by default. "To the
list" puts missing ingredients on the shopping list and stars the dish, and
starred dishes are suggested in Let's cook it. "Cooked it" uses up the pantry,
drops the pick and writes a line to `cookLog`, which History counts.

## Best-before dates

Anything that goes on a shelf without a date gets one looked up from
`src/data/shelfLife.ts`: a table of name patterns with how many days each
keeps in the fridge, freezer and cupboard (`null` = keeps, no date). The
store marks those with `bestBeforeAuto: true`; moving such an item to
another shelf looks it up again from that day (freezing buys months), while
a date typed from the packet (`bestBeforeAuto: false`) is never touched.
The "About to expire" list on Home runs on these dates.

How a date gets there, best first:

1. **Printed on the packet**, typed in or read by the camera: *Scan date* in
   the quantity sheet takes one photo and reads it on the phone with Google
   ML Kit (`src/lib/ocr.ts`, Latin first, then Japanese, Chinese, Korean and
   Devanagari). `src/lib/printedDate.ts` picks the date out of the text —
   MHD, Best before, SKT/TETT, 賞味期限, 有效日期 (also 民國 years), 유통기한,
   "12 months from manufacture" — and skips manufacture dates. The photo is
   deleted right after. The module is native: it works in the APK, not in
   Expo Go or on the web, where the button hides.
2. **In the 2D code**: the scanner reads GS1 Digital Link QR and DataMatrix
   codes (`src/lib/gs1.ts`); AI 17 / 15 / 16 is the packet's own date.
3. **Estimated** (`src/data/shelfLife.ts`): states (TK, Dose, getrocknet…),
   then the match that ends last in the name (German compounds), then the
   USDA FoodKeeper table (`src/data/foodkeeper.ts`, generated by
   `scripts/import-foodkeeper.js` from `scripts/data/foodkeeper.json`, CC0),
   then the same for hints — Open Food Facts categories from a barcode
   lookup, kept on the item as `hints`.

`scripts/fixtures/shelf-life.json` holds 277 ingredients from many kitchens
with sensible ranges; `npm test` fails if any drifts out. Add a line there
for any name that surprised you. Credits for Open Food Facts (ODbL) and
FoodKeeper live on the About screen — keep them if you touch it.

## REWE import

`app/import.tsx` takes a PDF and `readReweOrder` in `src/lib/orderImport.ts`
tries, in order, the pickup/delivery order (`src/lib/rewe.ts`) and the till
eBon (`src/lib/ebon.ts`). eBons are RC4-locked with an empty password, pack
their objects in object streams and use an embedded font with a ToUnicode map;
`src/lib/pdf.ts` handles all three. Till labels (`KRAEUT.SEITL.BIO`) are
expanded and get their umlauts back in `untill()`.

When you touch any of this, run `npm run test:rewe`. To add a real document
as a fixture, strip anything personal (names, addresses, card and terminal
numbers, TSE signatures) and keep only the article lines and the header
fields the parser reads — see `scripts/fixtures/`.

## Checking your work

1. `npm run tsc` and `npm test`.
2. Look at it. `npm run web` serves the app on `http://localhost:8081`; in dev
   the store is on `window.tidywell`, so you can seed a household from the
   browser console (`tidywell.getState().createHome(...)`, `addRecipe(...)`,
   `planMeal(...)`) and screenshot the screen at phone width (≈412 px).
3. Check the empty state too: a brand-new install with no rooms, recipes or
   history must still look friendly.

## Git and releases

- Work on a branch, commit in small steps with a message that says why, and
  push often. Don't commit `credentials/`, `android/` or `ios/`.
- **Release:** bump `version` (and `android.versionCode`) in `app.json`, merge
  to `main`, then tag: `git tag v1.3.0 && git push origin v1.3.0`. The
  *Release* workflow builds the APK and attaches it to a GitHub release.
  *Run workflow* on the Actions tab builds one without releasing.
- **Signing in CI** needs four repository secrets (Settings → Secrets and
  variables → Actions):
  - `ANDROID_KEYSTORE_BASE64` — `base64 -w0 credentials/tidywell.keystore`
  - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` —
    the values from `credentials/keystore.properties`

  Without them the APK is signed with a debug key and won't install over a
  copy signed with the real one.
- The *Check* workflow runs `tsc` and `npm test` on every pull request.
