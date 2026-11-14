import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usePitchTracker } from '../audio/usePitchTracker';
import { CentsMeter } from '../ui/CentsMeter';
import { PitchTrace } from '../ui/PitchTrace';
import { ScreenHeader } from '../ui/ScreenHeader';
import { useTunerReadout } from '../ui/useTunerReadout';

export function TunerScreen({ onExit }: { onExit: () => void }) {
  const { width } = useWindowDimensions();
  const { status, hz, history, start, stop } = usePitchTracker();
  const { note, cents, centsLabel } = useTunerReadout(hz);
  const running = status === 'running';

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Tuner" backLabel="Home" onBack={onExit} />
      <View style={styles.container}>
      <Text style={styles.readout}>{note ?? '—'}</Text>
      <Text style={styles.subtle}>
        {centsLabel !== null
          ? `${centsLabel > 0 ? '+' : ''}${centsLabel}¢`
          : running
            ? 'Sing a note…'
            : ''}
      </Text>
      <CentsMeter width={width - 32} cents={cents} />
      <PitchTrace width={width - 32} height={280} history={history} />
      <Pressable
        style={[styles.button, running && styles.buttonStop]}
        onPress={running ? stop : start}
      >
        <Text style={styles.buttonText}>{running ? 'Stop' : 'Start listening'}</Text>
      </Pressable>
      {status === 'denied' && (
        <Text style={styles.error}>Microphone access is needed to hear your voice.</Text>
      )}
      {status === 'error' && (
        <Text style={styles.error}>Couldn't start the microphone.</Text>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16 },
  readout: { fontSize: 64, fontWeight: '600' },
  subtle: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  button: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999, backgroundColor: '#4f46e5' },
  buttonStop: { backgroundColor: '#374151' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
