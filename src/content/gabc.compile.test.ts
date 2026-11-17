// Every melody in the lessons is written in standard gabc. This test hands each one to
// Gregorio's own compiler, the reference for the format, so a snippet that only this
// app's parser likes cannot slip in. It is skipped where `gregorio` is not installed.
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LESSONS, REPERTOIRE } from '../exercise/lessons';

const gregorio = spawnSync('gregorio', ['--version'], { encoding: 'utf8' });
const available = gregorio.status === 0;

/** Every gabc snippet in the lessons: each exercise's melody, and the pictures in the instructions. */
function snippets(): [string, string][] {
  const found: [string, string][] = [];
  for (const lesson of [...LESSONS, ...REPERTOIRE]) {
    for (const e of lesson.exercises) {
      if (e.gabc) found.push([e.id, e.gabc]);
      let n = 0;
      for (const match of e.instructions.matchAll(/\{\{\s*gabc\s*:([^}]*)\}\}/g)) {
        found.push([`${e.id} (picture ${++n})`, match[1].split(' @ ')[0].trim()]);
      }
    }
  }
  return found;
}

(available ? describe : describe.skip)('lesson melodies compile as gabc', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gabc-check-'));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('has melodies to check', () => {
    expect(snippets().length).toBeGreaterThan(90);
  });

  it.each(snippets())('%s', (_id, gabc) => {
    // gregorio writes beside its input, so run it in a scratch folder with relative names
    fs.writeFileSync(path.join(dir, 'snippet.gabc'), `name: snippet;\n%%\n${gabc} (::)\n`);
    const done = spawnSync('gregorio', ['-o', 'snippet.gtex', 'snippet.gabc'], { cwd: dir, encoding: 'utf8' });
    expect(done.stderr.trim()).toBe('');
    expect(done.status).toBe(0);
  });
});
