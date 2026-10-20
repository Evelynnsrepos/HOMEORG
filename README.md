# Homeorg<3 (lokal)

Ein Haushalts- und Putzplaner für iOS und Android — komplett auf dem Handy.
Kein Konto, kein Server, keine Synchronisation. Alle Daten liegen in einem
lokalen Speicher auf dem Gerät und verlassen es nie.

Nachbau der App von tidywell-app.com, ohne die Mehrpersonen-Features
(siehe [Was fehlt](#was-fehlt)).

## Starten

```bash
npm install
npx expo start
```

Dann in **Expo Go** (kostenlos im App Store / Play Store) den QR-Code scannen.
Handy und PC müssen im selben WLAN sein. Klemmt das Netzwerk:

```bash
npx expo start --tunnel
```

Im Browser testen (nur zum schnellen Draufschauen, Kamera und Haptik fehlen dort):

```bash
npm run web
```

## APK selbst bauen

Läuft komplett auf diesem Rechner — kein Expo-Konto, nichts wird hochgeladen.
Gebraucht werden JDK 21 und das Android SDK 36; beides ist hier schon
eingerichtet, und `scripts/build-apk.js` sucht sie selbst zusammen — aus
jeder Shell, egal was gerade im Environment steht.

```bash
npm run apk
```

Das macht der Reihe nach: native Projektdateien erzeugen, den Signierschlüssel
eintragen, Gradle bauen. Die fertige Datei landet in
`android/app/build/outputs/apk/release/app-release.apk` — per USB oder Cloud aufs
Handy, dort antippen, „Installation aus unbekannter Quelle" erlauben, fertig.

Gebaut wird nur für **arm64-v8a**, also jedes Android-Gerät ab etwa 2017. Das
spart gegenüber einem Universal-Build rund 70 MB; die APK liegt bei 93 MB, wovon
37 MB die Musik ist. Für ein altes 32-Bit-Gerät einmalig
`TIDYWELL_ABIS=armeabi-v7a,arm64-v8a npm run apk`.

Der erste Build lädt etwa 1,6 GB Gradle-Abhängigkeiten und dauert eine
Viertelstunde. Danach ist er in gut einer Minute durch.

**Der Signierschlüssel liegt in `credentials/` und gehört nicht ins Git.**
Behalte ihn. Ohne ihn lässt sich eine schon installierte Version nicht mehr
aktualisieren — dann hilft nur deinstallieren und neu aufspielen.

`npx expo prebuild` überschreibt `android/` komplett, deshalb setzt
`scripts/sign-android.js` die Signierung danach jedes Mal neu. `npm run apk`
erledigt das mit.

### Der andere Weg: EAS

`eas.json` liegt dabei, falls du lieber in der Cloud baust:

```bash
npm install -g eas-cli && eas login && eas build -p android --profile preview
```

Dafür brauchst du ein Expo-Konto, und das ganze Projekt wandert auf fremde
Server — samt der 37 MB Musik. Für iOS führt allerdings kein Weg daran vorbei,
und dort kommt ein Apple-Developer-Konto (99 €/Jahr) dazu. Ohne das bleibt
Expo Go, was zum Benutzen völlig reicht.

## Wie es funktioniert

**Sauberkeit** Jede Aufgabe hat eine Frequenz. Von 100 % (gerade geputzt) läuft
eine unsichtbare Linie auf 0 % (ein voller Zyklus vorbei). Der Prozentwert wird
bei jedem Öffnen neu gerechnet, nichts wird gespeichert. Unter 0 % geht es nicht,
über 100 % auch nicht. Monate sind echte Monate: 31. Januar + 1 Monat = 28. Februar.

**Reihenfolge** Zwei Zutaten — wie überfällig und wie leicht. Überfällig zählt
mehr, aber leichte Aufgaben bekommen einen Bonus. Deshalb schlägt „Arbeitsfläche
abwischen, etwas überfällig" den „Backofen, sehr überfällig". Fünf kleine Erfolge
bauen die Energie für den großen auf. Irgendwann hört „überfällig" auf zu wachsen,
damit nicht eine uralte Aufgabe für immer oben klebt.

**Raum-Prozent** Ein nach Minuten gewichteter Durchschnitt. Ein sauberer Spiegel
rettet keinen dreckigen Boden.

**Heute** Ein Zeitbudget pro Tag (Standard 30 Min). Homeorg<3 packt die
dringendsten Aufgaben hinein, bis das Budget voll ist — der Rest wartet in
„Got more time?". An Tagen, die nicht als Putztage markiert sind, gilt das halbe
Budget. Einmalige Termine hebeln das Limit aus. Abgehakte Aufgaben bleiben
durchgestrichen stehen und zählen gegen das Budget, damit der Tag auch mal endet.

**Münzen** 3 für leicht, 5 für mittel, 10 für tief. Zwei Aufgaben innerhalb von
zehn Minuten geben +2, ab der dritten +5. Ausgegeben wird im Shop: 120 Möbel,
6 Tapeten, 6 Böden, zehn Stellplätze pro Raum.

**Puppenhaus** Jeder Raum wird flach von vorn gezeichnet: Tapete, Bodenstreifen,
die fest eingebauten Sachen des Raumtyps (Küchenzeile, Badewanne, Bett) und zehn
Stellplätze. Alles Vektor, nichts als Bilddatei. Neue Räume kommen möbliert: pro
Raumtyp gibt es ein Starter-Set, das dir gehört und das du umstellen kannst.

**Musik** Startet von selbst, sobald in Focus eine Aufgabe auf dem Schirm steht
oder ein Sprint losgeht, und hört auf, wenn du den Screen verlässt. Läuft im
Hintergrund und bei gesperrtem Bildschirm weiter.

**Küche** Drei Reiter. *Rezepte* ist eine Sammlung von dem, was du kochen
kannst — kein Wochenplan, nichts hängt an einem Montag. Ein Rezept ist ein Name
und eine Zutatenliste, wie vorher. Homeorg<3 hält sie gegen den Vorrat und sortiert
danach: was heute sofort ginge, wo ein, zwei Sachen fehlen, wofür du erst einkaufen
musst. „Cooked it“ zieht die Zutaten vom Regal ab, der Einkaufsknopf schickt nur das
Fehlende auf die Liste, und der Stern merkt sich, worauf du Lust hast. Geschrieben
wird ein Rezept auf einem eigenen Screen: Name oben, Zutaten einzeln darunter —
tippen und auf + drücken, oder direkt aus dem Vorrat antippen. Im Vorrat schiebt das
Drei-Punkte-Menü eine Sache zwischen Kühlschrank, Gefrierfach und Schrank hin und
her. Ist der Vorrat leer, bleibt es eine schlichte Liste — sortieren kann die App
erst, wenn sie weiß, was da ist. Alte Wochenpläne wandern beim ersten Start
automatisch in die Sammlung, doppelte Gerichte zusammengefasst.

**Minuten** Focus und Sprint messen echte Zeit (Focus gedeckelt auf die Schätzung).
Ein einfacher Haken zählt die geschätzten Minuten.

## Aufbau

```
app/                 Screens (expo-router, dateibasiert)
  (tabs)/            Home, Today, My Home, Profile
  room/ task/ challenge/ decorate/ recipe/
  recipes.tsx shopping.tsx pantry.tsx Die drei Küchen-Reiter
src/
  lib/engine.ts      Sauberkeit, Priorität, Raumgesundheit, Tagesplanung
  lib/date.ts        Kalenderechte Intervalle
  state/store.ts     Zustand + AsyncStorage
  state/music.ts     Player-Zustand (eigener Store, eigene Persistenz)
  state/derived.ts   Abgeleitete Werte für die Screens
  data/              Raumtypen, Möbelkatalog, Challenges, Zerlegung, Playlists, Maßeinheiten
  ui/RoomCanvas.tsx  Der Raum: Wand, Boden, Einbauten, Stellplätze
  ui/Furniture.tsx   Die 120 Möbel als SVG-Rezepte
  ui/QuantitySheet.tsx  "Wie viel hast du gekauft?"
  ui/RecipeEditor.tsx   Ein Rezept schreiben, Zutat für Zutat
  ui/MusicEngine.tsx Der eine Audio-Player der App (hängt im Root-Layout)
assets/music/        27 Titel (~37 MB)
scripts/
  prepare-music.js   Musik kuratieren und neu kodieren
  make-icons.js      App-Icons als PNG erzeugen
  sign-android.js    Signierschlüssel nach jedem prebuild wieder eintragen
  build-apk.js       Release-APK bauen, findet JDK und SDK selbst
```

Alles Sichtbare ist im Code gezeichnet. Nur die Musik besteht aus Dateien, damit
liegt die App bei rund 40 MB.

### Musik neu bauen

Das Skript liest aus einem festen Pfad und schreibt nach `assets/music`. Wenn
deine Bibliothek woanders liegt:

```bash
TIDYWELL_MUSIC_SRC="D:/pfad/zu/Music" npm run music
```

## Woher die Sachen kommen

**Möbel** Keine Bilddateien. Jedes der 120 Teile ist ein Zeichenrezept in
`src/ui/Furniture.tsx` — Form plus drei Farben. Deshalb wiegt der ganze Shop
nichts und passt stilistisch zum Rest der App.

**Musik** 27 Titel aus deiner eigenen Bibliothek, in fünf Playlists nach deinen
Ordnern: Underwater, Tokyo Nights, Moonlight, With Words, Focus Beats. Neu
kodiert mit 64 kbit/s mono, weil Hintergrundmusik keine 300 MB braucht.

Ein ehrlicher Hinweis: die NCS-Titel sind für so etwas freigegeben, die
Spiele-Soundtracks (Persona, Subnautica) sind es normalerweise nicht. Für deine
eigene App auf deinem eigenen Handy ist das deine Entscheidung. Vor einem
Store-Release müsste die Musik raus oder durch lizenzfreie ersetzt werden — der
Player selbst bleibt davon unberührt, `prepare-music.js` bekommt einfach eine
andere Liste.

## Barcode scannen

Im Vorrat: **Scan a barcode** → Kamera drauf, Name und Packungsgröße kommen von
[Open Food Facts](https://world.openfoodfacts.org) (rund 425.000 in Deutschland
verkaufte Produkte), Menge bestätigen, ab ins Regal. Der Scanner bleibt offen,
damit du einen ganzen Einkauf am Stück wegräumen kannst.

Das ist die **einzige** Stelle, an der die App ins Netz geht, und sie schickt nur
die Nummer vom Karton — kein Konto, keine Kennung, keine Historie. Abschaltbar
unter Einstellungen, „Look barcodes up online"; der Scanner geht dann weiter, du
tippst den Namen nur selbst.

REWEs eigener Produkt-Endpunkt (`mobile-api.rewe.de`) löst nicht mehr auf, und
für Warenkorb oder Einkaufsliste gibt es keine öffentliche Schnittstelle. Hier
ist also nichts nachgebaut oder umgangen worden.

## Was fehlt

Bewusst weggelassen, weil es ohne Server nicht geht:

- Haushalt teilen, Mitglieder, Rollen, Kinder-Modus, Freigaben
- Live-Sprints zu mehreren (Solo-Sprint ist drin)
- Foto-Sync zwischen Geräten (Fotos bleiben lokal auf dem Gerät)

Die KI-Aufgabenzerlegung läuft regelbasiert auf dem Gerät statt über ein Modell —
das ist genau das, was die Original-App offline auch macht.

Alles ist freigeschaltet. Ein Abo ohne Server wäre sinnlos.
