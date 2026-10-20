import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { guessFor, places, qtyLabel, type Place } from '../src/data/units';
import { readReweOrder, type ImportDraft, type ImportPlan } from '../src/lib/orderImport';
import { NotAReweOrder } from '../src/lib/rewe';
import { useStore } from '../src/state/store';
import { colors } from '../src/theme';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tap, tapSuccess } from '../src/ui/base';
import { Confetti } from '../src/ui/Confetti';
import { QuantitySheet } from '../src/ui/QuantitySheet';

type Line = ImportDraft & { id: number };
type Stage =
  | { kind: 'picking' }
  | { kind: 'reading' }
  | { kind: 'failed'; message: string }
  | { kind: 'review'; plan: ImportPlan }
  | { kind: 'done'; counts: Record<Place, number>; ticked: number };

/** iOS and Android hand back a file in the cache; the web hands back a File. */
async function bytesOf(asset: DocumentPicker.DocumentPickerAsset): Promise<Uint8Array> {
  if (Platform.OS === 'web' && asset.file) return new Uint8Array(await asset.file.arrayBuffer());
  return new Uint8Array(await new File(asset.uri).arrayBuffer());
}

const reweDay = (day?: string) => (day ? `${day.slice(8)}.${day.slice(5, 7)}` : '');

/**
 * Hand it the PDF REWE sends with a pickup or delivery and the whole shop goes
 * on the shelves at once. Read on the phone, nothing is uploaded. You get to
 * look over the list first, because a guess about where Halloumi lives is
 * still a guess.
 */
export default function ImportOrder() {
  const router = useRouter();
  const shelfMemory = useStore((s) => s.shelfMemory);
  const importedOrders = useStore((s) => s.importedOrders);
  const putAway = useStore((s) => s.putAway);
  const rememberShelf = useStore((s) => s.rememberShelf);

  const [stage, setStage] = useState<Stage>({ kind: 'picking' });
  const [rows, setRows] = useState<Line[]>([]);
  const [editing, setEditing] = useState<Line | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [burst, setBurst] = useState(0);

  const pick = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    // changed your mind: whatever was on screen stays there
    if (res.canceled || !res.assets[0]) return;

    setStage({ kind: 'reading' });
    try {
      const plan = readReweOrder(await bytesOf(res.assets[0]), useStore.getState().shelfMemory);
      setRows(plan.drafts.map((d, id) => ({ ...d, id })));
      setStage({ kind: 'review', plan });
    } catch (e) {
      setStage({
        kind: 'failed',
        message:
          e instanceof NotAReweOrder
            ? "That PDF doesn't look like a REWE order. It wants the Abhol- or Lieferavis REWE sends by email."
            : "That file couldn't be opened. Try saving the PDF again and picking it from Files.",
      });
    }
  }, []);

  // a browser only opens a file dialog from a tap, so the web waits for the button
  useEffect(() => {
    if (Platform.OS !== 'web') pick();
  }, [pick]);

  const kept = rows.filter((r) => r.keep);
  const grouped = useMemo(() => {
    const out: { id: Place | 'other'; title: string; rows: Line[] }[] = places.map((p) => ({
      id: p.id,
      title: `${p.emoji}  ${p.name}`,
      rows: rows.filter((r) => r.food && r.place === p.id),
    }));
    out.push({ id: 'other', title: 'Not food', rows: rows.filter((r) => !r.food) });
    return out.filter((g) => g.rows.length);
  }, [rows]);

  function update(id: number, patch: Partial<Line>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function commit(plan: ImportPlan) {
    for (const r of kept) {
      // only learn from the ones you corrected, so the guesses keep improving
      const guessed = shelfMemory[r.key] ?? guessFor(r.name).place;
      if (r.place !== guessed) rememberShelf(r.key, r.place);
    }
    const ticked = putAway(
      kept.map(({ name, qty, unit, place, bestBefore }) => ({ name, qty, unit, place, bestBefore })),
      plan.orderNo,
    );
    const counts: Record<Place, number> = { fridge: 0, freezer: 0, pantry: 0 };
    for (const r of kept) counts[r.place]++;
    tapSuccess();
    setBurst((b) => b + 1);
    setStage({ kind: 'done', counts, ticked });
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/pantry'));

  /* ---- waiting and failing ----------------------------------------- */

  if (stage.kind === 'reading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.sage} />
        <Spacer h={10} />
        <T v="label">Reading your order…</T>
      </View>
    );
  }

  if (stage.kind === 'picking') {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={back} />
          <T v="heading">Import an order</T>
          <View style={{ width: 38 }} />
        </Row>
        <Spacer h={60} />
        <T center style={{ fontSize: 40 }}>
          {'\u{1F6CD}\u{FE0F}'}
        </T>
        <Spacer h={10} />
        <T v="heading" center>
          Your REWE order, straight onto the shelves
        </T>
        <Spacer h={6} />
        <T v="body" center style={{ alignSelf: 'center', maxWidth: 300 }}>
          Pick the PDF REWE emails with a pickup or delivery. It's read on this phone and never
          uploaded.
        </T>
        <Spacer h={22} />
        <Btn icon="document-text-outline" label="Choose the PDF" onPress={pick} />
      </Screen>
    );
  }

  if (stage.kind === 'failed') {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={back} />
          <T v="heading">Import an order</T>
          <View style={{ width: 38 }} />
        </Row>
        <Spacer h={60} />
        <T center style={{ fontSize: 40 }}>
          {'\u{1F9FE}'}
        </T>
        <Spacer h={10} />
        <T v="heading" center>
          Couldn't read that one
        </T>
        <Spacer h={6} />
        <T v="body" center style={{ alignSelf: 'center', maxWidth: 300 }}>
          {stage.message}
        </T>
        <Spacer h={22} />
        <Btn label="Pick another PDF" onPress={pick} />
        <Spacer h={8} />
        <Btn tone="ghost" label="Back to the pantry" onPress={back} />
      </Screen>
    );
  }

  /* ---- all put away ------------------------------------------------ */

  if (stage.kind === 'done') {
    const lines = places.filter((p) => stage.counts[p.id]).map((p) => `${stage.counts[p.id]} in the ${p.name.toLowerCase()}`);
    return (
      <View style={{ flex: 1 }}>
        <Screen>
          <Spacer h={80} />
          <T center style={{ fontSize: 44 }}>
            {'\u{1F9FA}'}
          </T>
          <Spacer h={10} />
          <T v="display" center style={{ fontSize: 28 }}>
            All put away
            <T v="display" color={colors.coral} style={{ fontSize: 28 }}>
              .
            </T>
          </T>
          <Spacer h={8} />
          <T v="body" center>
            {lines.join(', ')}.
          </T>
          {stage.ticked ? (
            <T v="label" center style={{ marginTop: 6 }}>
              {stage.ticked} ticked off your shopping list.
            </T>
          ) : null}
          <Spacer h={26} />
          <Btn label="See the pantry" onPress={() => router.replace('/pantry')} />
        </Screen>
        <Confetti trigger={burst} />
      </View>
    );
  }

  /* ---- the review -------------------------------------------------- */

  const { plan } = stage;
  const again = !!plan.orderNo && importedOrders.includes(plan.orderNo);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={back} />
          <T v="heading">Import an order</T>
          <View style={{ width: 38 }} />
        </Row>

        <Spacer h={16} />
        <T v="display" style={{ fontSize: 28 }}>
          Your REWE shop{plan.date ? ` of ${reweDay(plan.date)}` : ''}
          <T v="display" color={colors.coral} style={{ fontSize: 28 }}>
            .
          </T>
        </T>
        <Spacer h={6} />
        <T v="label">
          {rows.length} things came home. Untick what you don't want on a shelf, tap one to change it.
        </T>

        {again ? (
          <>
            <Spacer h={14} />
            <Card soft style={{ padding: 14, borderColor: colors.needsLove, borderWidth: 1.5 }}>
              <Row style={{ gap: 7 }}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.needsLove} />
                <T v="over" color={colors.needsLove}>
                  Already put away
                </T>
              </Row>
              <Spacer h={6} />
              <T v="body">
                This order is on the shelves already. Putting it away again doubles everything.
              </T>
            </Card>
          </>
        ) : null}

        {grouped.map((g) => (
          <View key={g.id}>
            <Spacer h={18} />
            <T v="over">{g.title}</T>
            <Spacer h={8} />
            {g.rows.map((r) => (
              <Card key={r.id} style={{ padding: 12, marginBottom: 8, opacity: r.keep ? 1 : 0.55 }}>
                <Row style={{ gap: 12 }}>
                  <Press
                    hitSlop={8}
                    onPress={() => {
                      tap();
                      update(r.id, { keep: !r.keep });
                    }}
                  >
                    <Ionicons
                      name={r.keep ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={r.keep ? colors.sage : colors.inkMuted}
                    />
                  </Press>
                  <Press style={{ flex: 1 }} onPress={() => setEditing(r)}>
                    <T v="heading" style={{ fontSize: 14.5 }} numberOfLines={2}>
                      {r.name}
                    </T>
                    <T v="caption">
                      {qtyLabel(r.qty, r.unit)}
                      {r.changed === 'amount' ? ' · not what you ordered' : ''}
                      {r.changed === 'substitute' ? ' · stand-in for something else' : ''}
                    </T>
                  </Press>
                  <Ionicons name="create-outline" size={15} color={colors.inkMuted} />
                </Row>
              </Card>
            ))}
          </View>
        ))}

        {plan.skipped.length ? (
          <>
            <Spacer h={10} />
            <Press onPress={() => setShowSkipped((s) => !s)}>
              <Row style={{ gap: 6 }}>
                <Ionicons name={showSkipped ? 'chevron-down' : 'chevron-forward'} size={14} color={colors.inkMuted} />
                <T v="label">{plan.skipped.length} left out</T>
              </Row>
            </Press>
            {showSkipped
              ? plan.skipped.map((s, i) => (
                  <T key={`${s.name}-${i}`} v="caption" style={{ marginLeft: 20, marginTop: 4 }}>
                    {s.name} ·{' '}
                    {s.why === 'missing' ? "didn't come" : s.why === 'replaced' ? 'swapped for another' : 'fee'}
                  </T>
                ))
              : null}
          </>
        ) : null}

        <Spacer h={22} />
        <Btn
          icon="checkmark"
          label={kept.length ? `Put ${kept.length} away` : 'Nothing ticked'}
          disabled={!kept.length}
          onPress={() => commit(plan)}
        />
        <Spacer h={8} />
        <Btn tone="ghost" label="Pick another PDF" onPress={pick} />
      </Screen>

      {editing ? (
        <QuantitySheet
          name={editing.name}
          note={editing.source}
          initial={{
            qty: editing.qty,
            unit: editing.unit,
            place: editing.place,
            bestBefore: editing.bestBefore,
          }}
          confirmLabel="Save"
          onCancel={() => setEditing(null)}
          onConfirm={(b) => {
            update(editing.id, { ...b, keep: true, food: true });
            setEditing(null);
          }}
        />
      ) : null}
    </View>
  );
}
