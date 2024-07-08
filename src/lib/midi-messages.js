// midi-messages.js
import { NOTE_OFF, NOTE_ON, EVENT_NOTE_START, EVENT_NOTE_STOP } from './constants';

const timersForPitches = {};
const DISPATCH_EVENTS = false;

export function startMidiNote ( pitch, velocity, selectedOutput, midiChannel ) {
    selectedOutput.send( [ 0x90 + midiChannel, pitch, velocity ] );
}

export function stopMidiNote ( pitch, selectedOutput, midiChannel ) {
    selectedOutput.send( [ 0x80 + midiChannel, pitch, 0 ] );
}

export function sendNoteWithDuration ( pitch, velocity, durationMs, selectedOutput, midiChannel ) {
    // If the note is playing already
    if ( Object.hasOwn( timersForPitches, pitch ) ) {
        clearTimeout( timersForPitches[ pitch ] );
        stopMidiNote( pitch, selectedOutput, midiChannel );
    }

    startMidiNote( pitch, velocity, selectedOutput, midiChannel );

    const timer = setTimeout(
        () => stopMidiNote( pitch, selectedOutput, midiChannel ),
        durationMs
    );

    timersForPitches[ pitch ] = timer;
}

/**
 * @fires EVENT_NOTE_START
 * @fires EVENT_NOTE_STOP
*/
export function onMidiMessage ( event, midiInputChannel, setNotesOn ) {
    const midiChannel = event.data[ 0 ] & 0x0F;

    if ( midiChannel !== midiInputChannel ) {
        return;
    }

    const cmd = event.data[ 0 ] >> 4;
    const pitch = event.data[ 1 ];
    const velocity = ( event.data.length > 2 ) ? event.data[ 2 ] : 1;

    setNotesOn( ( prevNotesOn ) => {
        const newNotesOn = { ...prevNotesOn };

        if ( cmd === NOTE_ON && velocity > 0 && !newNotesOn[ pitch ] ) {
            newNotesOn[ pitch ] = velocity;
            if ( DISPATCH_EVENTS ) {
                window.document.dispatchEvent(
                    new CustomEvent( EVENT_NOTE_START, { detail: { pitch, velocity, midiChannel } } )
                );
            }
        }

        else if ( cmd === NOTE_OFF || velocity === 0 ) {
            if ( newNotesOn[ pitch ] ) {
                delete newNotesOn[ pitch ];
                if ( DISPATCH_EVENTS ) {
                    window.document.dispatchEvent(
                        new CustomEvent( EVENT_NOTE_STOP, { detail: { pitch, midiChannel } } )
                    );
                }
            }
        }

        return newNotesOn;
    } );
}
