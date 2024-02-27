// midi-messages.js
import { MIDI_CHANNEL_IN, MIDI_CHANNEL_OUT, NOTE_OFF, NOTE_ON, EVENT_NOTE_START, EVENT_NOTE_STOP } from './constants';

export function startMidiNote ( pitch, velocity, selectedOutput, midiChannel = MIDI_CHANNEL_OUT ) {
    console.log( `START MIDI NOTE on ${midiChannel} @ ${pitch}, ${velocity}` );
    selectedOutput.send( [ 0x90 + ( midiChannel - 1 ), pitch, velocity ] );
}

export function stopMidiNote ( pitch, selectedOutput, midiChannel = MIDI_CHANNEL_OUT ) {
    console.log( `STOP MIDI NOTE on ${midiChannel} @ ${pitch}` );
    selectedOutput.send( [ 0x80 + ( midiChannel - 1 ), pitch, 0 ] );
}

/**
 * @fires EVENT_NOTE_START
 * @fires EVENT_NOTE_STOP
*/
export function onMidiMessage ( event, setNotesOn, selectedOutput ) {
    const timestamp = Date.now();
    const midiChannel = event.data[ 0 ] & 0x0F;

    if ( midiChannel !== MIDI_CHANNEL_IN ) {
        console.log( 'Ignoring channel', midiChannel, 'as not', MIDI_CHANNEL_IN );
        return;
    }

    const cmd = event.data[ 0 ] >> 4;
    const pitch = event.data[ 1 ];
    const velocity = ( event.data.length > 2 ) ? event.data[ 2 ] : 1;

    setNotesOn( ( prevNotesOn ) => {
        const newNotesOn = { ...prevNotesOn };

        if ( cmd === NOTE_ON && velocity > 0 && !newNotesOn[ pitch ] ) {
            newNotesOn[ pitch ] = { timestamp, velocity };
            // startMidiNote( pitch, velocity, selectedOutput ); // echo test
            window.document.dispatchEvent(
                new CustomEvent( EVENT_NOTE_START, { detail: { pitch, velocity, midiChannel } } )
            );
        }

        else if ( cmd === NOTE_OFF || velocity === 0 ) {
            if ( newNotesOn[ pitch ] ) {
                delete newNotesOn[ pitch ];
                // stopMidiNote( newNotesOn[ pitch ], selectedOutput ); // echo test
                window.document.dispatchEvent(
                    new CustomEvent( EVENT_NOTE_STOP, { detail: { pitch, midiChannel } } ) 
                );
            }
        }

        return newNotesOn;
    } );
}
