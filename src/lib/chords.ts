'use client';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS: { [key: string]: string } = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
};
const SHARPS: { [key: string]: string } = Object.fromEntries(Object.entries(FLATS).map(([k, v]) => [v, k]));

const getNoteIndex = (note: string): number => {
    const sanitizedNote = note.length > 1 && note[1] === 'b' ? FLATS[note] : note;
    return NOTES.indexOf(sanitizedNote);
};

const getNoteFromIndex = (index: number, preferSharp: boolean = false): string => {
    const note = NOTES[index % 12];
    if (!preferSharp && SHARPS[note]) {
        return SHARPS[note];
    }
    return note;
};

export const transposeChord = (chord: string, amount: number): string => {
    if (!chord) return '';
    const regex = /^([A-G][#b]?)(.*)/;
    const match = chord.match(regex);

    if (!match) return chord;

    const [, note, rest] = match;
    const preferSharp = amount > 0;
    
    let noteIndex = getNoteIndex(note);
    if (noteIndex === -1) return chord;

    noteIndex = (noteIndex + amount + 12) % 12;
    const newNote = getNoteFromIndex(noteIndex, preferSharp);
    
    return newNote + rest;
};

export const transposeSong = (songContent: string, amount: number): string => {
    if (!amount || amount === 0) return songContent;

    const chordRegex = /\[([A-G][#b]?[^\]]*)\]/g;
    return songContent.replace(chordRegex, (fullMatch, chord) => {
        const transposed = transposeChord(chord, amount);
        return `[${transposed}]`;
    });
};
