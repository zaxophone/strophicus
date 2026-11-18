import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { pageChars, paginate } from '../exercise/pages';
import { useProgress } from '../progress/ProgressContext';
import { ScreenHeader } from '../ui/ScreenHeader';
import { AccentExerciseScreen } from './AccentExerciseScreen';
import { SingExercise } from './ExerciseScreen';
import { ExerciseScreenProps } from './exerciseProps';
import { LessonDots } from './exerciseParts';
import { InstructionPage } from './InstructionPage';
import { NameExerciseScreen } from './NameExerciseScreen';

/**
 * One exercise of a lesson, as a short run of screens that never scroll: its
 * written instructions, a page at a time, and then the exercise itself. The
 * arrows move along that run, and on from the last screen to the next exercise.
 * The parent gives it a new `key` for each exercise, so each starts fresh.
 */
export function LessonScreen(props: ExerciseScreenProps) {
  const { lesson, index, startOnExercise, onIndexChange, onExit, onFinish } = props;
  const { progress, markPassed } = useProgress();
  const exercise = lesson.exercises[index];
  const { height } = useWindowDimensions();
  const pages = useMemo(() => paginate(exercise.instructions, pageChars(height)), [exercise.instructions, height]);
  // Which instruction page is showing, or whether the exercise itself is. They are kept
  // apart, and the page clamped, because how many pages there are changes with the
  // screen (rotating the phone, say) and the saved place must stay valid.
  const reading = exercise.kind === 'read';
  // A reading has no exercise page: coming back to it lands on its last page.
  const [onExercise, setOnExercise] = useState(!!startOnExercise && !reading);
  const [pageNumber, setPageNumber] = useState(startOnExercise && reading ? Infinity : 0);
  const page = Math.min(pageNumber, pages.length - 1);
  const backToInstructions = () => {
    setPageNumber(pages.length - 1);
    setOnExercise(false);
  };

  const last = index === lesson.exercises.length - 1;
  // Reaching the end of a reading is all that is asked of the student.
  const finishReading = () => {
    markPassed(exercise.id);
    if (last) onFinish();
    else onIndexChange(index + 1, false);
  };

  const lessonLabel = lesson.number === undefined ? lesson.title : `Lesson ${lesson.number}`;
  // a piece of repertoire goes back to the home page, labelled by where it sits there
  const backLabel = lesson.free ? 'Repertoire' : 'Lessons';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScreenHeader
        title={lessonLabel}
        subtitle={exercise.title}
        backLabel={backLabel}
        onBack={onExit}
      />
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <LessonDots
          lesson={lesson}
          index={index}
          cleared={false}
          progress={progress}
          onGo={(target) => onIndexChange(target, target < index)}
        />
      </View>

      {onExercise ? (
        exercise.kind === 'name' || exercise.kind === 'mark' ? (
          <NameExerciseScreen {...props} onBack={backToInstructions} />
        ) : exercise.kind === 'accent' ? (
          <AccentExerciseScreen {...props} onBack={backToInstructions} />
        ) : (
          <SingExercise {...props} onBack={backToInstructions} />
        )
      ) : (
        <InstructionPage
          exercise={exercise}
          paragraphs={pages[page]}
          page={page}
          pages={pages.length}
          finish={last}
          tonic={props.tonic}
          onTonicChange={props.onTonicChange}
          canGoBack={page > 0 || index > 0}
          onBack={() => (page > 0 ? setPageNumber(page - 1) : onIndexChange(index - 1, true))}
          onNext={() =>
            page < pages.length - 1 ? setPageNumber(page + 1) : reading ? finishReading() : setOnExercise(true)
          }
        />
      )}
    </View>
  );
}
