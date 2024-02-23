// triads
import { Note } from "tonal";

import { MIDI_CHANNEL } from './constants';

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

function sendMidiNotes ( { notes, velocity, selectedOutput } ) {
    let t = 0;
    for ( const note of notes ) {
        setTimeout(
            () => {
                selectedOutput.send( [
                    0x90 + ( MIDI_CHANNEL - 1 ),
                    note, velocity
                ] );
                console.log( 'SEND NOTE ON', note, '@', velocity, 'to', selectedOutput.name );
            },
            t += 100
        );
    }
}

export function addTriad (midiPitch, velocity, scaleNotes, selectedOutput) {
    const triad = getTriadNoteNames(midiPitch, scaleNotes);
    sendMidiNotes({ notes: triad, velocity, selectedOutput });
}