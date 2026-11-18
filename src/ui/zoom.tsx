import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

/** How far the staff may be zoomed, as a multiple of the Repertoire's size, and the step of each tap. */
export const ZOOM_MIN = 0.6;
export const ZOOM_MAX = 2;
const STEP = 0.2;

interface Zoom {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
}

const ZoomContext = createContext<Zoom>({ zoom: 1, zoomIn: () => {}, zoomOut: () => {} });

const round = (z: number) => Math.round(z * 10) / 10;

/** The size of the notation, kept while the app is open and shared by every exercise. */
export function ZoomProvider({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, round(z + STEP))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, round(z - STEP))), []);
  const value = useMemo(() => ({ zoom, zoomIn, zoomOut }), [zoom, zoomIn, zoomOut]);
  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}

export const useZoom = () => useContext(ZoomContext);

/** Two small buttons that make the notation smaller or larger. */
export function ZoomControl() {
  const { zoom, zoomIn, zoomOut } = useZoom();
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.button, zoom <= ZOOM_MIN && styles.off]}
        disabled={zoom <= ZOOM_MIN}
        onPress={zoomOut}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
      >
        <Text style={styles.text}>A−</Text>
      </Pressable>
      <Pressable
        style={[styles.button, zoom >= ZOOM_MAX && styles.off]}
        disabled={zoom >= ZOOM_MAX}
        onPress={zoomIn}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
      >
        <Text style={styles.text}>A+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end' },
  button: { minWidth: 48, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.primaryTint, alignItems: 'center' },
  off: { opacity: 0.4 },
  text: { color: colors.primaryInk, fontWeight: '700', fontSize: 15 },
});
