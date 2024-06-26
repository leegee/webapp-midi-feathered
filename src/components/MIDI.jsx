import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';

import {
    midiAccessAtom,
    midiOutputsAtom,
    selectedOutputAtom,
    notesOnAtom
} from '../lib/store';
import { onMidiMessage } from '../lib/midi-messages';

import styles from './MIDI.module.css';
import OutputSelect from './OutputSelect';
import PianoKeyboard from './Piano';
import ChordNoteRandomiserComponent from './ChordNoteRandomiserComponent';

let watchMidiInitialized = false;

export default function MIDIComponent () {
    const [ midiAccess, setMidiAccess ] = useAtom( midiAccessAtom );
    const [ midiOutputs, setMidiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput, setSelectedOutput ] = useAtom( selectedOutputAtom );
    const [ , setNotesOn ] = useAtom( notesOnAtom );

    const selectedOutputRef = useRef( null );

    useEffect( () => {
        if ( !midiAccess ) {
            try {
                navigator.requestMIDIAccess().then( ( midiAccess ) =>
                    setMidiAccess( midiAccess )
                );
            } catch ( error ) {
                console.error( 'Failed to access MIDI devices:', error );
                return (
                    <div className='error'>
                        Failed to access MIDI devices: ${ error }
                    </div>
                );
            }
        } else if ( !watchMidiInitialized ) {
            setMidiOutputs( () => {
                const newOutputs = Array.from( midiAccess.outputs.values() ).reduce(
                    ( map, output ) => {
                        map[ output.name ] = output;
                        return map;
                    },
                    {}
                );
                console.log( 'Initialized MIDI outputs', newOutputs );

                // Initialize the first MIDI output as the default selectedOutput
                const firstOutputName = Object.keys( newOutputs )[ 0 ];
                setSelectedOutput( firstOutputName );
                selectedOutputRef.current = midiOutputs[ selectedOutput ];

                midiAccess.inputs.forEach( ( inputPort ) => {
                    inputPort.onmidimessage = ( e ) =>
                        onMidiMessage( e, setNotesOn, selectedOutputRef.current );
                } );

                console.log( 'Initialized MIDI inputs' );
                return newOutputs;
            } );

            watchMidiInitialized = true;
        }
    }, [ midiAccess, setMidiAccess, midiOutputs, setMidiOutputs, setNotesOn, setSelectedOutput, selectedOutput ] );

    useEffect( () => {
        if ( midiOutputs[ selectedOutput ] ) {
            selectedOutputRef.current = midiOutputs[ selectedOutput ];
            console.log( 'Selected MIDI output:', selectedOutputRef.current );
        }
    }, [ selectedOutput, midiOutputs ] );

    return (
        <main className={ styles.main }>
            <h1>
                MIDI
                <OutputSelect />
            </h1>


            { selectedOutputRef.current && (
                <ChordNoteRandomiserComponent selectedOutput={ selectedOutputRef.current } />
            ) }

            <footer className='bottom'>
                <PianoKeyboard />
            </footer>
        </main>
    );
}
