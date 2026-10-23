import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { presetChallenges } from '../src/data/challenges';
import { playlists } from '../src/data/musicTracks';
import { stickerSets } from '../src/data/stickerCatalog';
import { shopItems } from '../src/data/shop';
import { useStore } from '../src/state/store';
import { colors } from '../src/theme';
import { Card, Divider, IconBtn, Row, Screen, Spacer, T } from '../src/ui/base';

export default function About() {
  const router = useRouter();
  const rooms = useStore((s) => s.rooms);
  const tasks = useStore((s) => s.tasks);
  const completions = useStore((s) => s.completions);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">About</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={16} />
      <T v="display" style={{ fontSize: 30 }}>
        Homeorg&lt;3
        <T v="display" color={colors.coral} style={{ fontSize: 30 }}>
          .
        </T>
      </T>
      <Spacer h={8} />
      <T v="body" style={{ fontSize: 15, lineHeight: 22 }}>
        A daily chore tracker built for real homes, real energy levels and real ADHD brains. No red,
        no missed-day shame, no lists that punish a bad day.
      </T>

      <Spacer h={20} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Line label="Where your data lives" value="This phone, only" />
        <Divider />
        <Line label="Account" value="None needed" />
        <Divider />
        <Line label="Works offline" value="Always, bar one lookup" />
        <Divider />
        <Line label="Everything unlocked" value="No subscription" />
      </Card>

      <Spacer h={16} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Line label="Rooms" value={`${rooms.length}`} />
        <Divider />
        <Line label="Chores" value={`${tasks.length}`} />
        <Divider />
        <Line label="Completions recorded" value={`${completions.length}`} />
        <Divider />
        <Line label="Shop items" value={`${shopItems.length}`} />
        <Divider />
        <Line label="Preset challenges" value={`${presetChallenges.length}`} />
        <Divider />
        <Line label="Music tracks" value={`${playlists.reduce((n, p) => n + p.tracks.length, 0)}`} />
      </Card>

      <Spacer h={20} />
      <T v="over">What's not here</T>
      <Spacer h={8} />
      <T v="body">
        Household sharing, live multiplayer sprints, kid approvals and photo sync all need a server
        to pass data between phones. This build is deliberately server-free, so those are left out.
        Everything else — the dollhouse, the sticker draws, Focus mode, Sprints, challenges, the kitchen
        and insights — runs entirely on the device.
      </T>

      <Spacer h={20} />
      <T v="over">The one thing that leaves the phone</T>
      <Spacer h={8} />
      <T v="body">
        Scanning a barcode sends that number — and nothing else — to Open Food Facts, an open
        product database, to get back a name and a pack size. No account, no identifier, no
        history. Turn it off in Settings and the scanner still works; you just type the name
        yourself. Everything else in the app never touches the network.
      </T>

      <Spacer h={20} />
      <T v="over">Best-before dates</T>
      <Spacer h={8} />
      <T v="body">
        A date printed on the packet always wins: type it in, scan it off the label, or let the QR
        code on newer packaging fill it in. Without one, the app estimates from where you keep it —
        a table of its own for German and international names, then the USDA FoodKeeper data, then
        the product categories from Open Food Facts. Estimates show with a ≈ and are a nudge to use
        things up, not a food safety guarantee. When in doubt, look, smell, and check the packet.
      </T>

      <Spacer h={20} />
      <T v="over">Data credits</T>
      <Spacer h={8} />
      <T v="body">
        Product names, sizes and categories: Open Food Facts (openfoodfacts.org), made available
        under the Open Database License (ODbL). Storage times: FoodKeeper by the USDA Food Safety
        and Inspection Service, public domain (CC0). Text recognition for scanning dates runs on the
        phone with Google ML Kit; no picture leaves the device.
      </T>

      <Spacer h={20} />
      <T v="over">Sticker art</T>
      <Spacer h={8} />
      <T v="body">
        The pixel stickers are from LPC Revised (github.com/ElizaWy/LPC), cut into single pieces and
        scaled up, under CC-BY 3.0 / OGA-BY 3.0. Thank you to everyone who drew them:
      </T>
      <Spacer h={6} />
      {stickerSets.map((set) => (
        <T key={set.id} v="caption" style={{ marginBottom: 4 }}>
          {set.emoji} {set.name}: {set.artists.join(', ') || 'see CREDITS.md'}
        </T>
      ))}

      <Spacer h={20} />
      <T v="over">Where the art comes from</T>
      <Spacer h={8} />
      <T v="body">
        None of it is an image file. Every piece of furniture, every wall, floor, chart and room is
        a drawing recipe in the code — a shape and three colours. That is why the whole shop costs
        nothing to carry around, and why it all looks like one thing.
      </T>

      <Spacer h={20} />
      <T v="over">The music</T>
      <Spacer h={8} />
      <T v="body">
        {playlists.length} playlists, {playlists.reduce((n, p) => n + p.tracks.length, 0)} tracks,
        re-encoded from the owner's own library and bundled with the app. Nothing streams. This
        build is for personal use — game soundtracks are not licensed for redistribution, so the
        music would have to come out before the app went to a store.
      </T>

      <Spacer h={24} />
      <T v="caption" center>
        Built as a local-only recreation for personal use.
      </T>
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ padding: 15, justifyContent: 'space-between' }}>
      <T v="label">{label}</T>
      <T v="label" color={colors.ink}>
        {value}
      </T>
    </Row>
  );
}
