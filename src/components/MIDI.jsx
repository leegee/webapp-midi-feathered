/** https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API  */

// eslint-disable-next-line no-unused-vars
import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';

import { midiAccessAtom, midiOutputsAtom, selectedOutputAtom, notesOnAtom, /*scaleNotesAtom*/ } from '../lib/store';
import { onMidiMessage } from '../lib/midi-messages';

import OutputSelect from './OutputSelect';
import NotesOnDisplay from './NotesOnDisplay';
// import ScaleSelector from './ScaleSelector';
import PianoKeyboard from './Piano';
import NoteModifierComponent from './NoteModifier';

let watchMidiInitialized = false;

export default function MIDIComponent () {
    const [ midiAccess, setMidiAccess ] = useAtom( midiAccessAtom );
    const [ midiOutputs, setMidiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput ] = useAtom( selectedOutputAtom );
    const [, setNotesOn ] = useAtom( notesOnAtom );
    // const [ scaleNotes, ] = useAtom( scaleNotesAtom );

    const selectedOutputRef = useRef( null ); 
    // const scaleNotesRef = useRef(null); 

    useEffect( () => {
        if (!midiAccess) {
            try {
                navigator.requestMIDIAccess().then(midiAccess => setMidiAccess(midiAccess));
            } catch (error) {
                console.error('Failed to access MIDI devices:', error);
                return (<div className='error'>Failed to access MIDI devices: ${error}</div>);
            }
        }
        else if ( !watchMidiInitialized ) {
            setMidiOutputs(() => {
                const newOutputs = Array.from(midiAccess.outputs.values()).reduce((map, output) => {
                    map[output.name] = output;
                    return map;
                }, {} );
                console.log( "Initialised MIDI outputs", newOutputs );
    
                midiAccess.inputs.forEach(inputPort => {
                    inputPort.onmidimessage = e => onMidiMessage(e, setNotesOn, selectedOutputRef.current);
                } );
                
                console.log("Initialised MIDI inputs");
                return newOutputs;
            });
    
            watchMidiInitialized = true;
        }
    }, [ midiAccess, setMidiAccess, midiOutputs, setMidiOutputs, setNotesOn, selectedOutput ] );
    
    // useEffect(() => {
    //     scaleNotesRef.current = scaleNotesRef;
    // }, [scaleNotes]);

    useEffect( () => {
        if (midiOutputs[selectedOutput]) {
            selectedOutputRef.current = midiOutputs[ selectedOutput ];
            window.selectedOutput = midiOutputs[ selectedOutput ];
        }
    }, [selectedOutput, midiOutputs]);
        
    return (
        <main>
            <h1>MIDI Test
                <OutputSelect />
                {/* { selectedOutputRef.current !== null && <ScaleSelector selectedOutput={ selectedOutputRef.current } /> } */}
            </h1>

            <PianoKeyboard/>

            { selectedOutputRef.current !== null && <NoteModifierComponent /> }

            <NotesOnDisplay />
        </main>
    );
}

