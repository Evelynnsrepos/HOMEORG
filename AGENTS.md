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
npm run test:rewe      # REWE order + eBon import tests — must pass
npm run apk            # local release APK (needs JDK 21 + Android SDK 36)
```

There is no linter and no other test suite. "Done" means `tsc` and
`test:rewe` pass **and** you looked at the screen you changed (see
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
| `src/ui/Decor.tsx` | `Garland`/`ScreenGarland` (vines + bulbs) and `Sticker`. |
| `src/ui/Kitchen.tsx` | Kitchen pieces: effort meter, `PickTile`, `packRows`, `DaySheet`. |
| `src/theme.ts` | Colours, radii, fonts, shadows. |
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
- Colours come from `colors` in `src/theme.ts`. The token names are older than
  the palette: **`coral` is the pink, `sage` is the mint**. Don't hard-code a
  hex that a token already covers.
- The palette has no alarm red. Overdue is a warm peach (`needsLove`,
  `needsYou`) — the app never scolds.
- Decorate with `ScreenGarland` at the top of tab screens and the odd
  `Sticker` on a card corner (absolute, small negative offset, slight tilt).
  Keep it to one or two stickers per screen; they're seasoning.
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

## The kitchen in one paragraph

Recipes live in the book (`recipes`). "Let's cook it" shows **picks**
(`mealPlan`): dishes you chose for the next days. A pick's `day` is optional —
weekday planning is a switch (`settings.cookByDay`), off by default. "To the
list" puts missing ingredients on the shopping list and stars the dish, and
starred dishes are suggested in Let's cook it. "Cooked it" uses up the pantry,
drops the pick and writes a line to `cookLog`, which History counts.

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

1. `npm run tsc` and `npm run test:rewe`.
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
- The *Check* workflow runs `tsc` and `test:rewe` on every pull request.
