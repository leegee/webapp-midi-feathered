// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { ScaleType, Scale } from "tonal";

import { EVENT_NOTE_START, EVENT_NOTE_STOP } from '../lib/constants';
import { scaleRootNoteAtom, scaleNameAtom, scaleNotesAtom } from '../lib/store';
import { startMidiNote, stopMidiNote } from '../lib/midi-messages';
// import { notesOnAtom } from '../lib/store';

let addedListeners = false;

function ScaleSelector ({selectedOutput}) {
    const [ scaleRootNote ] = useAtom( scaleRootNoteAtom );
    const [ scaleName, setScaleName ] = useAtom( scaleNameAtom );
    const [ , setScaleNotes ] = useAtom( scaleNotesAtom );
    // const [ notesOn ] = useAtom( notesOnAtom );

    const handleScaleChange = ( event ) => setScaleName( event.target.value ) ;

    useEffect(
        () => {
            const startTriadLocal = (e) => { 
                console.log( '----------- START TRAID', e.detail.pitch );
                startMidiNote( e.detail.pitch, e.detail.velocity, selectedOutput, e.detail.midiChannel );
                // startTriad(e.detail.pitch, e.detail.velocity, scaleNotes, selectedOutput)
            };
        
            const stopTriadLocal = (e) => { 
                console.log( '-----------STOP TRAID', e.detail.pitch );
                stopMidiNote( e.detail.pitch, selectedOutput, e.detail.midiChannel );
                // stopTriad(e.detail.pitch, e.detail.velocity, scaleNotes, selectedOutput)
            };
        
            setScaleNotes( Scale.get( scaleRootNote + ' ' + scaleName ).notes );

            if ( ! addedListeners ) {
                window.document.addEventListener( EVENT_NOTE_START, startTriadLocal );
                window.document.addEventListener( EVENT_NOTE_STOP, stopTriadLocal );
            } else {
                window.document.removeEventListener( EVENT_NOTE_START, startTriadLocal );
                window.document.removeEventListener( EVENT_NOTE_STOP, stopTriadLocal );
            }
            addedListeners = true;
        },
        [ scaleRootNote, scaleName, setScaleNotes, selectedOutput ]
    );

    return (
        <select className='padded' onChange={ handleScaleChange } value={ scaleName }>
            { ScaleType.names().sort().map( scaleName => (
                <option key={ scaleName } value={ scaleName }>{ scaleName }</option>
            ) ) }
        </select>
    );
}

ScaleSelector.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};

export default ScaleSelector;
