import { LESSON_INTRO } from '../content/wordsWithWings/intro';
import { LESSON_1 } from '../content/wordsWithWings/lesson1';
import { LESSON_2 } from '../content/wordsWithWings/lesson2';
import { LESSON_3 } from '../content/wordsWithWings/lesson3';
import { LESSON_4 } from '../content/wordsWithWings/lesson4';
import { LESSON_5 } from '../content/wordsWithWings/lesson5';
import { LESSON_6 } from '../content/wordsWithWings/lesson6';
import { LESSON_7 } from '../content/wordsWithWings/lesson7';
import { LESSON_8 } from '../content/wordsWithWings/lesson8';
import { LESSON_9 } from '../content/wordsWithWings/lesson9';
import { LESSON_10 } from '../content/wordsWithWings/lesson10';
import { LESSON_11 } from '../content/wordsWithWings/lesson11';
import { ARSIS_THESIS } from '../content/arsisThesis';
import { PRACTICE } from '../content/practice';
import type { Exercise, Lesson } from './exercise';

export const LESSONS: Lesson[] = [LESSON_INTRO, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5, LESSON_6, ARSIS_THESIS, LESSON_7, LESSON_8, LESSON_9, LESSON_10, LESSON_11, PRACTICE];

export const ALL_EXERCISES: Exercise[] = LESSONS.flatMap((lesson) => lesson.exercises);
