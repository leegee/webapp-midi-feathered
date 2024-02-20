/** https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API  */


import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { midiAccessAtom } from '../lib/midi';


const NOTE_ON = 9;
const NOTE_OFF = 8;

const notesOn = new Map();

function onMidiMessage(event) {
    console.log( event.data );
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = ( event.data.length > 2 ) ? event.data[ 2 ] : 1;
    const timestamp = Date.now();

    if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
        console.log(`... from ${event.srcElement.name} note off: pitch:${pitch}, velocity: ${velocity}`);
      
        // Complete the note!
        const note = notesOn.get(pitch);
        if (note) {
          console.log(`🎵 pitch:${pitch}, duration:${timestamp - note} ms.`);
          notesOn.delete(pitch);
        }
      } else if (cmd === NOTE_ON) {
        console.log(`🎧 from ${event.srcElement.name} note off: pitch:${pitch}, velocity: {velocity}`);
        
        // One note can only be on at once.
        notesOn.set(pitch, timestamp);
    }
}


function watchMidi ( getMidiAccess ) {
    if ( getMidiAccess ) {
        getMidiAccess.inputs.forEach( ( inputPort ) => {
            inputPort.onmidimessage = onMidiMessage;
        } );
    }
}

async function setupMidiAccess ( getMidiAccess, setMIDIAccess ) {
    if ( !getMidiAccess ) {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            setMIDIAccess( midiAccess );
        } catch ( e ) {
            console.error( 'Failed to access MIDI devices:', e );
        }
    }
}

// Closes open connections
function cleanup (getMidiAccess) {
    if ( getMidiAccess ) {
        getMidiAccess.inputs.forEach( ( input ) => {
            input.close();
        } );
        getMidiAccess.outputs.forEach( ( output ) => {
            output.close();
        } );
    }
}

export function MIDIComponent () {
    const [ getMidiAccess, setMIDIAccess ] = useAtom( midiAccessAtom );

    // onMount
    useEffect( () => {
        setupMidiAccess( getMidiAccess, setMIDIAccess );
        watchMidi(getMidiAccess);
        return cleanup( getMidiAccess );
    }, [ getMidiAccess, setMIDIAccess ] );

    return (
        <div>
            <h1>MIDI Access Status</h1>
            <p>{ getMidiAccess ? 'MIDI Access Granted' : 'MIDI Access Denied' }</p>
        </div>
    );
}

