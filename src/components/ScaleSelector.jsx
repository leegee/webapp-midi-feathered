// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { ScaleType, Scale } from "tonal";
import { scaleRootNoteAtom, scaleNameAtom, scaleNotesAtom } from '../lib/midi';
import { startMidiNote, stopMidiNote } from '../lib/midi-messages';
import { EVENT_NOTE_START, EVENT_NOTE_STOP } from '../lib/constants';

let addedListeners = false;

function ScaleSelector ({selectedOutput}) {
    const [ scaleRootNote ] = useAtom( scaleRootNoteAtom );
    const [ scaleName, setScaleName ] = useAtom( scaleNameAtom );
    const [ , setScaleNotes ] = useAtom( scaleNotesAtom );

    const handleScaleChange = ( event ) => setScaleName( event.target.value ) ;

    useEffect(
        () => {
            const startTriad = (e) => { 
                console.log( '----------- START TRAID', e );
                startMidiNote( e.detail.pitch, e.detail.velocity, selectedOutput, e.detail.midiChannel );
            };
        
            const stopTriad = (e) => { 
                console.log( '-----------STOP TRAID', e );
                stopMidiNote( e.detail.pitch, selectedOutput, e.detail.midiChannel );
            };
        
            setScaleNotes( Scale.get( scaleRootNote + ' ' + scaleName ).notes );

            if ( ! addedListeners ) {
                window.document.addEventListener( EVENT_NOTE_START, startTriad );
                window.document.addEventListener( EVENT_NOTE_STOP, stopTriad );
            } else {
                window.document.removeEventListener( EVENT_NOTE_START, startTriad );
                window.document.removeEventListener( EVENT_NOTE_STOP, stopTriad );
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
