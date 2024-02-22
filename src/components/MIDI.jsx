/** https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API  */

// eslint-disable-next-line no-unused-vars
import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';

import { midiAccessAtom, midiOutputsAtom, selectedOutputAtom, notesOnAtom, scaleNotesAtom } from '../lib/midi';
import { onMidiMessage } from '../lib/onMidiMessage';

import OutputSelect from './OutputSelect';
import NotesOnDisplay from './NotesOnDisplay';
import ScaleSelector from './ScaleSelector';
import PianoKeyboard from './Piano';

let watchMidiInitialized = false;

export function MIDIComponent () {
    const [ midiAccess, setMidiAccess ] = useAtom( midiAccessAtom );
    const [ midiOutputs, setMidiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput ] = useAtom( selectedOutputAtom );
    const [ notesOn, setNotesOn ] = useAtom( notesOnAtom );
    const [ scaleNotes, ] = useAtom( scaleNotesAtom );

    const selectedOutputRef = useRef(null); 

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
                    inputPort.onmidimessage = e => onMidiMessage(e, setNotesOn, scaleNotes,  selectedOutputRef);
                });
                console.log("Initialised MIDI inputs");
    
                return newOutputs;
            });
    
            watchMidiInitialized = true;
        }
    }, [ midiAccess, setMidiAccess, midiOutputs, setMidiOutputs, setNotesOn, scaleNotes, selectedOutput ] );
    
    useEffect(() => {
        if (midiOutputs[selectedOutput]) {
            selectedOutputRef.current = midiOutputs[selectedOutput];
        }
    }, [selectedOutput, midiOutputs]);
        
    return (
        <div>
            <h1>MIDI Test
                <OutputSelect />
                <ScaleSelector />
            </h1>

            <PianoKeyboard/>

            <NotesOnDisplay notesOn={ notesOn } />

        </div>
    );
}

