// midi-messages.js
import { EVENT_NOTE_START, EVENT_NOTE_STOP } from './constants';

export const NOTE_ON = 9;
export const NOTE_OFF = 8;
export const CC = 11;

const timersForPitches = {};
const DISPATCH_EVENTS_STD = false;
const DISPATCH_EVENTS_FOR_EXTRAS = true;

export function startMidiNote ( pitch, velocity, selectedOutput, midiChannel ) {
    midiChannel = 2;
    selectedOutput.send( [ 0x90 + midiChannel, pitch, velocity ] );
}

export function stopMidiNote ( pitch, selectedOutput, midiChannel ) {
    midiChannel = 2;
    selectedOutput.send( [ 0x80 + midiChannel, pitch, 0 ] );
}

export function sendNoteWithDuration ( pitch, velocity, durationMs, selectedOutput, midiChannel ) {
    // If the note is playing already, stop it
    if ( Object.hasOwn( timersForPitches, pitch ) ) {
        clearTimeout( timersForPitches[ pitch ] );
        stopMidiNote( pitch, selectedOutput, midiChannel );
    }

    startMidiNote( pitch, velocity, selectedOutput, midiChannel );
    if ( DISPATCH_EVENTS_FOR_EXTRAS ) {
        window.dispatchEvent(
            new CustomEvent( EVENT_NOTE_START, { detail: { pitch, velocity, midiChannel } } )
        );
    }

    const timer = setTimeout(
        () => {
            stopMidiNote( pitch, selectedOutput, midiChannel );
            if ( DISPATCH_EVENTS_FOR_EXTRAS ) {
                window.dispatchEvent(
                    new CustomEvent( EVENT_NOTE_STOP, { detail: { pitch, velocity, midiChannel } } )
                );
            }

        },
        durationMs
    );

    timersForPitches[ pitch ] = timer;
}

/**
 * @fires EVENT_NOTE_START
 * @fires EVENT_NOTE_STOP
*/
export function onMidiMessage ( event, midiInputChannel, setNotesOn, setCCsOn ) {
    const midiChannel = event.data[ 0 ] & 0x0F;

    if ( midiInputChannel && midiChannel !== midiInputChannel ) {
        return;
    }

    const cmd = event.data[ 0 ] >> 4;
    const pitch = event.data[ 1 ];
    const velocity = ( event.data.length > 2 ) ? event.data[ 2 ] : 1;

    if ( cmd === CC ) {
        setCCsOn( ( prevCCsOn ) => {
            return {
                ...prevCCsOn,
                [ pitch ]: velocity
            }
        } );
    }

    else if ( cmd === NOTE_ON || cmd === NOTE_OFF ) {
        console.debug( 'note on' )
        setNotesOn( ( prevNotesOn ) => {
            const newNotesOn = { ...prevNotesOn };

            if ( cmd === NOTE_ON && velocity > 0 && !newNotesOn[ pitch ] ) {
                newNotesOn[ pitch ] = velocity;
                if ( DISPATCH_EVENTS_STD ) {
                    window.dispatchEvent(
                        new CustomEvent( EVENT_NOTE_START, { detail: { pitch, velocity, midiChannel } } )
                    );
                }
            }

            else if ( cmd === NOTE_OFF || velocity === 0 ) {
                if ( newNotesOn[ pitch ] ) {
                    delete newNotesOn[ pitch ];
                    if ( DISPATCH_EVENTS_STD ) {
                        window.dispatchEvent(
                            new CustomEvent( EVENT_NOTE_STOP, { detail: { pitch, midiChannel } } )
                        );
                    }
                }
            }

            return newNotesOn;
        } );
    }

    else {
        console.debug( `Unhandled MIDI event - cmd: ${ cmd }` )
    }
}
