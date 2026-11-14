import { File, Paths } from 'expo-file-system';

import { parseProgress, Progress } from './progress';

const file = () => new File(Paths.document, 'progress.json');

/** Reads the saved progress; an empty record if there is none or it can't be read. */
export async function loadProgress(): Promise<Progress> {
  try {
    const saved = file();
    return saved.exists ? parseProgress(await saved.text()) : {};
  } catch {
    return {};
  }
}

/** Saves progress. Failing to save only means it won't be remembered next time. */
export async function saveProgress(progress: Progress): Promise<void> {
  try {
    const target = file();
    if (!target.exists) target.create();
    await target.write(JSON.stringify(progress));
  } catch {
    // keep going with what is in memory
  }
}
