import { atom } from 'jotai';
import { MIDI_CHANNEL_IN, MIDI_CHANNEL_OUT } from './constants';

export const midiAccessAtom = atom(null);
export const midiOutputsAtom = atom({});
export const selectedOutputAtom = atom( '' );
export const notesOnAtom = atom({});

export const midiInputChannelAtom = atom( MIDI_CHANNEL_IN );
export const midiOutputChannelAtom = atom(MIDI_CHANNEL_OUT);
