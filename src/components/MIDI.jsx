/** https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API  */

// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { Note } from "tonal";

import { midiAccessAtom, midiOutputsAtom, selectedOutputAtom, notesOnAtom, scaleNotesAtom } from '../lib/midi';
import OutputSelect from './OutputSelect';
import NotesOnDisplay from './NotesOnDisplay';
import ScaleSelector from './ScaleSelector';
import PianoKeyboard from './Piano';

const NOTE_ON = 9;
const NOTE_OFF = 8;

let watchMidiInitialized = false;

function playNote ( midiPitch, scaleNotes ) {
    const noteName = Note.fromMidi(midiPitch);
    console.log('xxx', scaleNotes)
    const rootNote = scaleNotes[ 0 ];
    // Calculate the index of the third and fifth notes in the scale:
    // For the first note, the third is the second note in the scale
    const thirdIndex = ( rootNote === noteName ) ? 2 : 3; 
    // Add 2 to get the fifth note, modulo the length of the scale
    const fifthIndex = ( thirdIndex + 2 ) % scaleNotes.length; 

    // Construct the triad using the first, third, and fifth notes of the scale
    const triadNotes = [
        rootNote,
        scaleNotes[thirdIndex],
        scaleNotes[fifthIndex]
    ];

    console.info( rootNote, triadNotes );

    return triadNotes;
}

function onMidiMessage ( event, setNotesOn, scaleNotes ) {
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = ( event.data.length > 2 ) ? event.data[ 2 ] : 1;
    const timestamp = Date.now();

    setNotesOn((prevNotesOn) => {
        const newNotesOn = { ...prevNotesOn }; 

        if (cmd === NOTE_ON && velocity > 0 && !newNotesOn[pitch]) {
            console.log(`NOTE ON pitch:${pitch}, velocity: ${velocity}`);
            newNotesOn[ pitch ] = { timestamp, velocity };
            playNote( pitch, scaleNotes );
        }
        else if ( cmd === NOTE_OFF || velocity === 0) {
            if (newNotesOn[pitch]) {
                console.log(`NOTE OFF pitch:${pitch}: duration:${timestamp - newNotesOn[pitch][0]} ms.`);
                delete newNotesOn[pitch];
            } else {
                console.warn(`NOTE OFF pitch:${pitch} BUT NOT IN notesOn?!`);
            }
        }

        return newNotesOn; 
    });
}

export function MIDIComponent () {
    const [ midiAccess, setMidiAccess ] = useAtom( midiAccessAtom );
    const [ midiOutputs, setMidiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput, setSelectedOutput ] = useAtom( selectedOutputAtom );
    const [ notesOn, setNotesOn ] = useAtom( notesOnAtom );
    const [ scaleNotes, ] = useAtom( scaleNotesAtom );
    
    useEffect(() => {
        if (!midiAccess) {
            try {
                navigator.requestMIDIAccess().then(midiAccess => setMidiAccess(midiAccess));
            } catch (error) {
                console.error( 'Failed to access MIDI devices:', error );
                return ( <div>Failed to access MIDI devices: ${error}</div> );
            }
        }
        else {
            const newOutputs = Array.from(midiAccess.outputs.values());
            setMidiOutputs(newOutputs);
            if ( !watchMidiInitialized ) {
                console.log( "Init midi listeners" );
                midiAccess.inputs.forEach(inputPort => {
                    inputPort.onmidimessage = e => onMidiMessage(e, setNotesOn, scaleNotes);
                });
                watchMidiInitialized = true;
            }
        }
    }, [ midiAccess, setMidiAccess, setMidiOutputs, setNotesOn, scaleNotes ]);

    return (
        <div>
            <h1>MIDI Test</h1>

            <OutputSelect
                midiOutputs={midiOutputs}
                selectedOutput={Number(selectedOutput)}
                setSelectedOutput={setSelectedOutput}
            />

            <ScaleSelector />

            <PianoKeyboard notesOn={ notesOn } />

            <NotesOnDisplay notesOn={ notesOn } />

        </div>
    );
}

