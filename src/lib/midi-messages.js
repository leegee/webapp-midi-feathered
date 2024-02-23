// onMidiMessage
import { MIDI_CHANNEL, NOTE_OFF, NOTE_ON, EVENT_NOTE_START, EVENT_NOTE_STOP } from './constants';

export function startMidiNote ( pitch , velocity, selectedOutput, midiChannel = MIDI_CHANNEL ) {
    console.log( "START MIDI NOTE", pitch, velocity );
    selectedOutput.send( [ 0x90 + ( midiChannel - 1 ), pitch, velocity ] );
}

export function stopMidiNote ( pitch, selectedOutput, midiChannel = MIDI_CHANNEL) {
    console.log( "STOP MIDI NOTE", pitch );
    selectedOutput.send( [ 0x80 + ( midiChannel - 1 ), pitch, 0 ] );
}

/**
 * @fires EVENT_NOTE_START
 * @fires EVENT_NOTE_STOP
*/
export function onMidiMessage ( event, setNotesOn, selectedOutput ) {
    const timestamp = Date.now();
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;

    setNotesOn((prevNotesOn) => {
        const newNotesOn = { ...prevNotesOn };

        if (cmd === NOTE_ON && velocity > 0 && !newNotesOn[pitch]) {
            console.log(`NOTE ON ${cmd} pitch:${pitch}, velocity: ${velocity}`);
            newNotesOn[pitch] = { timestamp, velocity };
            startMidiNote( pitch, velocity, selectedOutput );
            window.document.dispatchEvent( new CustomEvent( EVENT_NOTE_START, {
                detail: {
                    pitch,
                    velocity,
                    midiChannel: MIDI_CHANNEL
                }
            } ) );
        }
        
        else if (cmd === NOTE_OFF || velocity === 0) {
            if ( newNotesOn[ pitch ] ) {
                console.log( `NOTE OFF ${ cmd } pitch:${ pitch }: duration:${ timestamp - newNotesOn[ pitch ].timestamp } ms.` );
                stopMidiNote( newNotesOn[ pitch ], selectedOutput );
                delete newNotesOn[ pitch ];
                window.document.dispatchEvent( new CustomEvent( EVENT_NOTE_STOP, {
                    detail: {
                        pitch,
                        midiChannel: MIDI_CHANNEL
                    }
                } ) );
            }
        }
        
        return newNotesOn;
    });
}
