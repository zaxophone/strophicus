import { Skia, SkTypeface } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';

const SOURCE = require('../../assets/fonts/greciliae.ttf');
/** Pauses between attempts to load the font, in milliseconds. */
const RETRY_DELAYS = [200, 500, 1000, 2000, 4000];

let loaded: SkTypeface | null = null;
let pending: Promise<SkTypeface> | null = null;

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function load(): Promise<SkTypeface> {
  const uri = Image.resolveAssetSource(SOURCE)?.uri;
  if (!uri) throw new Error('The chant font file is missing from the app');
  let failure: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(await Skia.Data.fromURI(uri));
      if (typeface) return typeface;
      failure = new Error('The chant font could not be read');
    } catch (error) {
      failure = error;
    }
    const delay = RETRY_DELAYS[attempt];
    if (delay !== undefined) await pause(delay);
  }
  throw failure;
}

/**
 * Loads the chant font once for the whole app, trying again if it fails: a
 * single failed load would otherwise leave every staff without notes.
 */
export function loadChantTypeface(): Promise<SkTypeface> {
  if (loaded) return Promise.resolve(loaded);
  if (!pending) {
    pending = load().then(
      (typeface) => (loaded = typeface),
      (error) => {
        pending = null; // the next staff to appear tries again
        throw error;
      },
    );
  }
  return pending;
}

/** The chant font at a size in pixels, or null until it has loaded. */
export function useChantFont(size: number) {
  const [typeface, setTypeface] = useState<SkTypeface | null>(loaded);
  useEffect(() => {
    if (typeface) return;
    let alive = true;
    loadChantTypeface().then(
      (loadedFace) => alive && setTypeface(loadedFace),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [typeface]);
  return useMemo(() => (typeface ? Skia.Font(typeface, size) : null), [typeface, size]);
}
