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
import { LESSON_12 } from '../content/wordsWithWings/lesson12';
import { LESSON_13 } from '../content/wordsWithWings/lesson13';
import { LESSON_14 } from '../content/wordsWithWings/lesson14';
import { LESSON_15 } from '../content/wordsWithWings/lesson15';
import { LESSON_16 } from '../content/wordsWithWings/lesson16';
import { LESSON_17 } from '../content/wordsWithWings/lesson17';
import { LESSON_18 } from '../content/wordsWithWings/lesson18';
import { LESSON_19 } from '../content/wordsWithWings/lesson19';
import { LESSON_20 } from '../content/wordsWithWings/lesson20';
import { ARSIS_THESIS } from '../content/arsisThesis';
import { PRACTICE } from '../content/practice';
import { REPERTOIRE } from '../content/repertoire';
import type { Exercise, Lesson } from './exercise';

export const LESSONS: Lesson[] = [LESSON_INTRO, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5, LESSON_6, ARSIS_THESIS, LESSON_7, LESSON_8, LESSON_9, LESSON_10, LESSON_11, LESSON_12, LESSON_13, LESSON_14, LESSON_15, LESSON_16, LESSON_17, LESSON_18, LESSON_19, LESSON_20, PRACTICE];

export { REPERTOIRE };

export const ALL_EXERCISES: Exercise[] = [...LESSONS, ...REPERTOIRE].flatMap((lesson) => lesson.exercises);
