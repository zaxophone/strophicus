import type { Lesson } from '../exercise/exercise';

export interface ExerciseScreenProps {
  lesson: Lesson;
  index: number;
  /** MIDI note the reference melody starts from; kept by the parent between exercises. */
  tonic: number;
  onTonicChange: (tonic: number) => void;
  /** Moves to another exercise, landing on its exercise page rather than its instructions if asked. */
  onIndexChange: (index: number, toExercise?: boolean) => void;
  onExit: () => void;
  /** Called on finishing the lesson's last exercise. */
  onFinish: () => void;
  /** Open on the exercise itself, as when coming back from the exercise after it. */
  startOnExercise?: boolean;
}

/** What the screen for doing an exercise needs; the wrapper supplies the header and the instruction pages. */
export interface ExerciseBodyProps extends ExerciseScreenProps {
  /** Goes back to the exercise's instructions. */
  onBack: () => void;
}
