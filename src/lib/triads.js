// triads
import { Note } from "tonal";

import { MIDI_CHANNEL_IN, NOTE_ON, NOTE_OFF } from './constants';

function getTriadNoteNames ( midiPitch, scaleNotes ) {
    const [ rootNote, octaveNumber ] = Note.fromMidi( midiPitch ).split( '' );
    const rootIndex = scaleNotes.indexOf( rootNote );
    if ( rootIndex === -1 ) {
        throw new Error( `The MIDI pitch ${ rootNote } does not correspond to any note in the scale: ${ scaleNotes.join( ' ' ) }` );
    }

    const thirdIndex = ( rootIndex + 2 ) % scaleNotes.length;
    const fifthIndex = ( rootIndex + 4 ) % scaleNotes.length;

    const triad = [
        Note.get( rootNote + octaveNumber ).midi,
        Note.get( scaleNotes[ thirdIndex ] + octaveNumber ).midi,
        Note.get( scaleNotes[ fifthIndex ] + octaveNumber ).midi,
    ];

    return triad;
}

export function startTriad (midiPitch, velocity, scaleNotes, selectedOutput) {
    const notes = getTriadNoteNames(midiPitch, scaleNotes);
    for ( const note of notes ) {
        selectedOutput.send( [ NOTE_ON + MIDI_CHANNEL_IN - 1, note, velocity ] );
        console.log( 'SEND NOTE ON', note, '@', velocity, 'to', selectedOutput.name );
    }
}

export function stopTriad (midiPitch, velocity, scaleNotes, selectedOutput) {
    const notes = getTriadNoteNames( midiPitch, scaleNotes );
    for ( const note of notes ) {
        selectedOutput.send( [ NOTE_OFF + MIDI_CHANNEL_IN - 1, note, velocity ] );
        console.log( 'SEND NOTE OFF', note, '@', velocity, 'to', selectedOutput.name );
    }
}
