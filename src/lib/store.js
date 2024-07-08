import { atom } from 'jotai';
import { DEFAULT_MIDI_CHANNEL_IN, DEFAULT_MIDI_CHANNEL_OUT } from './constants';

export const midiAccessAtom = atom( null );
export const midiOutputsAtom = atom( {} );
export const selectedOutputAtom = atom( '' );
export const CCsOnAtom = atom( {} );
export const notesOnAtom = atom( {} );
export const featheredNotesOnAtom = atom( {} );
export const midiInputChannelAtom = atom( DEFAULT_MIDI_CHANNEL_IN );
export const midiOutputChannelsAtom = atom( [ DEFAULT_MIDI_CHANNEL_OUT ] );
