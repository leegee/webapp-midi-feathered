import { atom } from 'jotai';

export const midiAccessAtom = atom(null);
export const midiOutputsAtom = atom([]);
export const selectedOutputAtom = atom(0);
export const notesOnAtom = atom({});
export const scaleRootNoteAtom = atom('C');
export const scaleNameAtom = atom('major');
export const scaleNotesAtom = atom([]);


