import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { midiAccessAtom } from './lib/midi';


async function accessMidi(getMidiAccess, setMIDIAccess){
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

function MIDIComponent () {
    const [ getMidiAccess, setMIDIAccess ] = useAtom( midiAccessAtom );

    // onMount
    useEffect( () => {
        accessMidi(getMidiAccess, setMIDIAccess);
        return cleanup( getMidiAccess );
    }, [ getMidiAccess, setMIDIAccess ] );

    return (
        <div>
            <h1>MIDI Access Status</h1>
            <p>{ getMidiAccess ? 'MIDI Access Granted' : 'MIDI Access Denied' }</p>
        </div>
    );
}

export default MIDIComponent;
