import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { NativeModules } from 'react-native';

import { findPrintedDate, type PrintedDate } from './printedDate';

/**
 * Reading the best-before off a photo, on the phone, with Google ML Kit. No
 * picture and no text leaves the device.
 *
 * The native module is only in the real app build (npm run apk, the release
 * workflow); in Expo Go and on the web it isn't there, and the "Scan date"
 * button doesn't show.
 */
export function ocrAvailable(): boolean {
  return !!NativeModules.TextRecognition;
}

/**
 * Latin first: it covers German, English, Turkish and the digits of most
 * labels. Only when that finds no labelled date are the other scripts tried —
 * Japanese and Chinese read 賞味期限 and 有效日期, Korean 유통기한, Devanagari
 * the Hindi on Indian packs — and everything read is put together.
 */
const SCRIPTS = [
  TextRecognitionScript.JAPANESE,
  TextRecognitionScript.CHINESE,
  TextRecognitionScript.KOREAN,
  TextRecognitionScript.DEVANAGARI,
];

export async function readPrintedDate(uri: string): Promise<PrintedDate | null> {
  const texts: string[] = [];
  const read = async (script: TextRecognitionScript) => {
    try {
      const r = await TextRecognition.recognize(uri, script);
      if (r.text) texts.push(r.text);
    } catch {
      // one script failing to load is no reason to give up on the others
    }
  };

  await read(TextRecognitionScript.LATIN);
  let found = findPrintedDate(texts.join('\n'));
  if (found?.labelled) return found;

  for (const script of SCRIPTS) {
    await read(script);
    found = findPrintedDate(texts.join('\n'));
    if (found?.labelled) return found;
  }
  return found;
}
