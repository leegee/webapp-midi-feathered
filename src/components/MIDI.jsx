/** https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API  */

// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { midiAccessAtom, midiOutputsAtom, selectedOutputAtom, notesOnAtom } from '../lib/midi';
import OutputSelect from './OutputSelect';

const NOTE_ON = 9;
const NOTE_OFF = 8;

let watchMidiInitialized = false;

function onMidiMessage ( event, setNotesOn ) {
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = ( event.data.length > 2 ) ? event.data[ 2 ] : 1;
    const timestamp = Date.now();

    setNotesOn((prevNotesOn) => {
        const newNotesOn = { ...prevNotesOn }; // Create a copy of the previous notes

        if (cmd === NOTE_ON && velocity > 0 && !newNotesOn[pitch]) {
            console.log(`NOTE ON pitch:${pitch}, velocity: ${velocity}`);
            newNotesOn[pitch] = [timestamp, velocity];
        }
        else if ( cmd === NOTE_OFF || velocity === 0) {
            if (newNotesOn[pitch]) {
                console.log(`NOTE OFF pitch:${pitch}: duration:${timestamp - newNotesOn[pitch][0]} ms.`);
                delete newNotesOn[pitch];
            } else {
                console.log(`NOTE OFF pitch:${pitch} BUT NOT IN notesOn?!`);
            }
        } else {
            console.warn('NOTE - WHAT?', pitch, velocity);
        }

        return newNotesOn; 
    });
}

export function MIDIComponent () {
    const [ midiAccess, setMidiAccess ] = useAtom( midiAccessAtom );
    const [ midiOutputs, setMidiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput, setSelectedOutput ] = useAtom( selectedOutputAtom );
    const [ notesOn, setNotesOn ] = useAtom( notesOnAtom );
    
    useEffect(() => {
        if (!midiAccess) {
            try {
                navigator.requestMIDIAccess().then(midiAccess => setMidiAccess(midiAccess));
            } catch (error) {
                console.error('Failed to access MIDI devices:', error);
            }
        } else {
            const newOutputs = Array.from(midiAccess.outputs.values());
            setMidiOutputs(newOutputs);
        
            if ( !watchMidiInitialized ) {
                console.log( "INIT MIDI LISTENERS" );
                midiAccess.inputs.forEach(inputPort => {
                    inputPort.onmidimessage = e => onMidiMessage(e, setNotesOn);
                });
                watchMidiInitialized = true;
            }
        }
    }, [midiAccess, notesOn]);

    return (
        <div>
            <h1>MIDI Test</h1>

            <OutputSelect
                midiOutputs={midiOutputs}
                selectedOutput={Number(selectedOutput)}
                setSelectedOutput={setSelectedOutput}
            />

            <ul>
                {Object.entries(notesOn).map(([key, value]) => ( <li key={key}>{key}: {value}</li> ))}
            </ul>
        </div>
    );
}

