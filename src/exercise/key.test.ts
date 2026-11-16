import { describeKey, keyTonic, parseKey } from './key';

describe('the book key tag', () => {
  it('reads the tags the book uses', () => {
    expect(parseKey('do=d')).toEqual({ syllable: 'do', pitchClass: 2 });
    expect(parseKey('la=a')).toEqual({ syllable: 'la', pitchClass: 9 });
    expect(parseKey('mi=f-sharp')).toEqual({ syllable: 'mi', pitchClass: 6 });
    expect(parseKey('fa=b-flat')).toEqual({ syllable: 'fa', pitchClass: 10 });
  });

  it('reads te as the flatted ti', () => {
    expect(parseKey('te=c')).toEqual({ syllable: 'ti', pitchClass: 1 });
  });

  it('takes the first of several alternatives', () => {
    expect(parseKey('do=a/b-flat/b')).toEqual({ syllable: 'do', pitchClass: 9 });
    expect(parseKey('sol=g/g-sharp/a')).toEqual({ syllable: 'sol', pitchClass: 7 });
  });

  it('refuses a tag it cannot read', () => {
    expect(() => parseKey('do d')).toThrow();
    expect(() => parseKey('so=d')).toThrow();
  });

  it('finds do for the tag', () => {
    expect(keyTonic(parseKey('do=d'))).toBe(62);
    expect(keyTonic(parseKey('do=a'))).toBe(57);
    // re is on e, so do is the d below it
    expect(keyTonic(parseKey('re=e'))).toBe(62);
    // la is on a, so do is the c three semitones above... nine below
    expect(keyTonic(parseKey('la=a'))).toBe(60);
    expect(keyTonic(parseKey('sol=a'))).toBe(62);
    expect(keyTonic(parseKey('fa=a'))).toBe(64);
  });

  it('keeps do within an octave above A3', () => {
    for (const tag of ['do=c', 'do=b', 'mi=f-sharp', 'fa=b-flat', 'la=f-sharp', 'sol=e']) {
      const tonic = keyTonic(parseKey(tag));
      expect(tonic).toBeGreaterThanOrEqual(57);
      expect(tonic).toBeLessThan(69);
    }
  });

  it('says the key as the book does', () => {
    expect(describeKey(parseKey('do=d'))).toBe('do = D');
    expect(describeKey(parseKey('fa=b-flat'))).toBe('fa = B♭');
  });
});
