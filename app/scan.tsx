import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qtyLabel } from '../src/data/units';
import { parseGs1 } from '../src/lib/gs1';
import { lookupBarcode, type Product } from '../src/lib/products';
import { useStore } from '../src/state/store';
import { colors, radius } from '../src/theme';
import { Btn, Row, Spacer, T, tap, tapSuccess } from '../src/ui/base';
import { QuantitySheet } from '../src/ui/QuantitySheet';

/** A scanned product, plus the date printed into its 2D code when it had one. */
type Pending = Product & { expiry?: string; dateKind?: 'use-by' | 'best-before' | 'sell-by' };

const DATE_NOTE = { 'use-by': 'use-by from the code', 'best-before': 'best before from the code', 'sell-by': 'sell-by from the code' };

/**
 * Point the camera at a barcode and the thing lands on a shelf. Built for
 * unpacking a whole shop: it stays open and keeps scanning until you're done.
 *
 * Besides the plain barcode it reads the QR and DataMatrix codes that newer
 * packaging carries (GS1 Digital Link). Those can hold the date of this very
 * packet, which then fills in "Good for" — no guessing needed.
 */
export default function Scan() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const lookupOnline = useStore((s) => s.settings.lookupOnline);
  const addPantry = useStore((s) => s.addPantry);

  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [torch, setTorch] = useState(false);
  /** the date camera in the sheet needs the camera to itself */
  const [datePaused, setDatePaused] = useState(false);
  /** the scanner fires many times a second — one barcode at a time is plenty */
  const lock = useRef<string | null>(null);

  const onScanned = useCallback(
    async ({ data }: { data: string }) => {
      const text = data.trim();
      if (!text || lock.current || pending) return;
      // a GS1 2D code carries the product number and maybe the date; any
      // other QR code (a menu, a Wi-Fi login) is not ours to read
      const gs1 = /^\d{8,14}$/.test(text) ? null : parseGs1(text);
      if (!gs1 && !/^\d{8,14}$/.test(text)) return;
      const ean = gs1?.gtin ?? text;
      const date = gs1?.expiry ? { expiry: gs1.expiry, dateKind: gs1.dateKind } : {};
      lock.current = text;
      tapSuccess();

      if (!lookupOnline || (gs1 && !gs1.gtin)) {
        setPending({ ean, name: '', place: 'pantry', unit: 'pc', found: false, ...date });
        return;
      }

      setBusy(true);
      const product = await lookupBarcode(ean);
      setBusy(false);
      setPending({ ...product, ...date });
    },
    [lookupOnline, pending],
  );

  function close() {
    setPending(null);
    // let the camera settle before it can fire on the same packet again
    setTimeout(() => {
      lock.current = null;
    }, 900);
  }

  /* ---- permission gates ------------------------------------------- */

  if (!permission) {
    return (
      <View style={sheet(insets.top)}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={sheet(insets.top)}>
        <T style={{ fontSize: 40 }}>{'\u{1F4F7}'}</T>
        <Spacer h={12} />
        <T v="display" center style={{ fontSize: 26 }}>
          The camera stays here
        </T>
        <Spacer h={8} />
        <T v="body" center style={{ maxWidth: 300 }}>
          Homeorg&lt;3 uses it to read barcodes and nothing else. No pictures are taken, nothing is
          stored, nothing is uploaded.
        </T>
        <Spacer h={22} />
        <Btn label="Allow the camera" onPress={requestPermission} style={{ alignSelf: 'stretch' }} />
        <Spacer h={10} />
        <Btn label="Not now" tone="ghost" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  /* ---- the scanner ------------------------------------------------- */

  return (
    <View style={{ flex: 1, backgroundColor: '#14120F' }}>
      {datePaused ? (
        <View style={{ flex: 1 }} />
      ) : (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr', 'datamatrix'],
          }}
          onBarcodeScanned={pending ? undefined : onScanned}
        />
      )}

      {/* framing box */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: '76%',
            aspectRatio: 1.7,
            borderRadius: radius.lg,
            borderWidth: 2.5,
            borderColor: busy ? colors.gold : '#FFFFFFAA',
          }}
        />
        <Spacer h={16} />
        <T v="label" color="#EDE4D4">
          {busy ? 'Looking it up…' : 'Hold a barcode or QR code in the frame'}
        </T>
      </View>

      {/* top bar */}
      <Row
        style={{
          position: 'absolute',
          top: insets.top + 6,
          left: 12,
          right: 12,
          justifyContent: 'space-between',
        }}
      >
        <Circle icon="close" onPress={() => router.back()} />
        <Circle
          icon={torch ? 'flashlight' : 'flashlight-outline'}
          active={torch}
          onPress={() => setTorch((t) => !t)}
        />
      </Row>

      {/* what you've put away so far */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: insets.bottom + 16,
          backgroundColor: '#14120FE6',
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          gap: 8,
        }}
      >
        {added.length ? (
          <>
            <T v="over" color="#8E8578">
              {added.length} put away
            </T>
            {added.slice(-3).map((line, i) => (
              <Row key={`${line}-${i}`} style={{ gap: 7 }}>
                <Ionicons name="checkmark-circle" size={13} color={colors.sage} />
                <T v="body" color="#D8CDBB" numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>
                  {line}
                </T>
              </Row>
            ))}
          </>
        ) : (
          <T v="body" center color="#8E8578" style={{ fontSize: 13 }}>
            {lookupOnline
              ? 'Names and pack sizes come from Open Food Facts.'
              : 'Lookup is off, so you type the name yourself.'}
          </T>
        )}
        <Spacer h={2} />
        <Btn label="Done" tone="quiet" onPress={() => router.back()} />
      </View>

      {pending ? (
        <QuantitySheet
          name={pending.name}
          note={pending.found ? 'Scanned' : `Not in the database · ${pending.ean}`}
          initial={{ qty: pending.qty ?? 1, unit: pending.unit, place: pending.place, bestBefore: pending.expiry }}
          hints={pending.hints}
          dateNote={pending.dateKind ? DATE_NOTE[pending.dateKind] : undefined}
          onScanningChange={setDatePaused}
          onCancel={close}
          onConfirm={(b) => {
            addPantry({ ...b, hints: pending.hints });
            setAdded((a) => [...a, `${b.name} · ${qtyLabel(b.qty, b.unit)}`]);
            tap();
            close();
          }}
        />
      ) : null}
    </View>
  );
}

const sheet = (top: number) =>
  ({
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: top,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  }) as const;

function Circle({
  icon,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: active ? colors.gold : '#00000066',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={19} color={active ? colors.night : '#F5EFE3'} />
    </Pressable>
  );
}
