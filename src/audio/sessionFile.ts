import {
  AudioRecorder,
  FileDirectory,
  FileFormat,
  FilePreset,
} from 'react-native-audio-api';

/**
 * Has the recorder write each listening session to a WAV in the app's cache,
 * straight from the microphone. Playback uses this file rather than the audio
 * handed to JavaScript, which can miss chunks when the app is busy.
 *
 * In development the path is logged as "CAPTURE_FILE <path>", so a session
 * can be pulled from an emulator and replayed through the pitch pipeline with
 *   adb exec-out run-as app.chant.dev cat <path> > session.wav
 */
export function enableSessionFile(recorder: AudioRecorder): void {
  recorder.enableFileOutput({
    format: FileFormat.Wav,
    preset: FilePreset.Medium,
    channelCount: 1,
    directory: FileDirectory.Cache,
    subDirectory: 'chant',
    fileName: `session-${Date.now()}`,
  });
}

export function logSessionFile(result: unknown): void {
  if (__DEV__) console.log('CAPTURE_FILE', JSON.stringify(result));
}
