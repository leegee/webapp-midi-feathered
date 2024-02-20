import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { midiAccessAtom } from '../lib/midi';


async function setupMidiAccess(getMidiAccess, setMIDIAccess){
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

function watchMidi ( getMidiAccess ) {
    if ( getMidiAccess ) {
        getMidiAccess.inputs.forEach( ( inputPort ) => {
            inputPort.onmidimessage = onMidiMessage;
        } );
    }
}

function onMidiMessage(event) {
    let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
    for (const character of event.data) {
      str += `0x${character.toString(16)} `;
    }
    console.log(str);
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

