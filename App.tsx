import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { loadChantTypeface } from './src/chant/typeface';
import { LESSONS, REPERTOIRE } from './src/exercise/lessons';
import { nextExerciseIndex } from './src/progress/progress';
import { ProgressProvider, useProgress } from './src/progress/ProgressContext';
import { LessonScreen } from './src/screens/LessonScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TunerScreen } from './src/screens/TunerScreen';

// Start loading the chant font now, so the first staff already has it.
loadChantTypeface().catch(() => {});

type Route =
  | { name: 'home' }
  | { name: 'lesson'; lessonIndex: number; exerciseIndex: number; toExercise?: boolean; piece?: boolean }
  | { name: 'done'; lessonIndex: number; piece?: boolean }
  | { name: 'tuner' };

export default function App() {
  return (
    <ProgressProvider>
      <Screens />
    </ProgressProvider>
  );
}

function Screens() {
  const { progress } = useProgress();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  // The reference pitch is a preference, so it carries from one exercise to the next.
  const [tonic, setTonic] = useState(57);

  const home = () => setRoute({ name: 'home' });

  // The Android back button goes up to the home page before it leaves the app.
  useEffect(() => {
    if (route.name === 'home') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setRoute({ name: 'home' });
      return true;
    });
    return () => subscription.remove();
  }, [route.name]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {route.name === 'home' && (
        <HomeScreen
          lessons={LESSONS}
          progress={progress}
          repertoire={REPERTOIRE}
          onOpenLesson={(lessonIndex, exerciseIndex) => setRoute({ name: 'lesson', lessonIndex, exerciseIndex })}
          onOpenPiece={(lessonIndex, exerciseIndex) => setRoute({ name: 'lesson', lessonIndex, exerciseIndex, piece: true })}
          onOpenTuner={() => setRoute({ name: 'tuner' })}
        />
      )}
      {route.name === 'lesson' && (
        <LessonScreen
          key={`${route.piece ? 'p' : 'l'}${route.lessonIndex}-${route.exerciseIndex}`}
          startOnExercise={route.toExercise}
          lesson={(route.piece ? REPERTOIRE : LESSONS)[route.lessonIndex]}
          index={route.exerciseIndex}
          tonic={tonic}
          onTonicChange={setTonic}
          onIndexChange={(exerciseIndex, toExercise) => setRoute({ ...route, exerciseIndex, toExercise })}
          onExit={home}
          onFinish={() => setRoute({ name: 'done', lessonIndex: route.lessonIndex, piece: route.piece })}
        />
      )}
      {route.name === 'done' && (
        <CompleteScreen
          lesson={(route.piece ? REPERTOIRE : LESSONS)[route.lessonIndex]}
          next={route.piece ? undefined : LESSONS[route.lessonIndex + 1]}
          onHome={home}
          onNext={() =>
            setRoute({
              name: 'lesson',
              lessonIndex: route.lessonIndex + 1,
              exerciseIndex: nextExerciseIndex(LESSONS[route.lessonIndex + 1], progress),
            })
          }
        />
      )}
      {route.name === 'tuner' && <TunerScreen onExit={home} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
});
