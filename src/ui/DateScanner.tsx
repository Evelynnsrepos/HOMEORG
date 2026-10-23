import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readPrintedDate } from '../lib/ocr';
import { colors, radius } from '../theme';
import { Btn, Spacer, T, tap, tapSuccess } from './base';

type Stage = { kind: 'aim' } | { kind: 'reading' } | { kind: 'missed' };

/**
 * One photo of the label, read on the phone for its best-before. The photo is
 * deleted as soon as it's been read.
 */
export function DateScanner({
  onFound,
  onClose,
}: {
  onFound: (day: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'aim' });
  const [torch, setTorch] = useState(false);

  async function snap() {
    if (!camera.current || stage.kind === 'reading') return;
    tap();
    setStage({ kind: 'reading' });
    let uri: string | undefined;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.7, shutterSound: false });
      uri = photo?.uri;
      const found = uri ? await readPrintedDate(uri) : null;
      if (found) {
        tapSuccess();
        onFound(found.date);
        return;
      }
      setStage({ kind: 'missed' });
    } catch {
      setStage({ kind: 'missed' });
    } finally {
      if (uri) {
        try {
          new File(uri).delete();
        } catch {
          // the cache gets cleared by the system anyway
        }
      }
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#14120F' }}>
        {permission?.granted ? (
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" enableTorch={torch} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <T v="body" center color="#EDE4D4">
              Reading the date needs the camera. The photo is read on this phone and deleted right after.
            </T>
            <Spacer h={16} />
            <Btn label="Allow the camera" onPress={requestPermission} />
          </View>
        )}

        {/* a wide, short frame: that's the shape of a printed date */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: '84%', height: 110, borderRadius: radius.lg, borderWidth: 2.5, borderColor: '#FFFFFFAA' }} />
          <Spacer h={14} />
          <T v="label" color="#EDE4D4" center style={{ maxWidth: 300 }}>
            {stage.kind === 'reading'
              ? 'Reading the label…'
              : stage.kind === 'missed'
                ? "Couldn't find a date. Closer, steadier, or with the light on?"
                : 'Fill the frame with the date: MHD, Best before, SKT, 賞味期限, 有效日期…'}
          </T>
        </View>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingBottom: insets.bottom + 24,
            paddingTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <Round icon="close" onPress={onClose} />
          <Pressable
            onPress={snap}
            disabled={!permission?.granted || stage.kind === 'reading'}
            style={({ pressed }) => ({
              width: 74,
              height: 74,
              borderRadius: 37,
              borderWidth: 4,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {stage.kind === 'reading' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.coral }} />
            )}
          </Pressable>
          <Round icon={torch ? 'flashlight' : 'flashlight-outline'} active={torch} onPress={() => setTorch((t) => !t)} />
        </View>
      </View>
    </Modal>
  );
}

function Round({ icon, onPress, active }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: active ? colors.gold : '#00000066',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={active ? colors.night : '#F5EFE3'} />
    </Pressable>
  );
}
