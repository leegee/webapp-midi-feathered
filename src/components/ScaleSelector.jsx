// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { ScaleType, Scale } from "tonal";
import { scaleNameAtom, scaleNotesAtom } from '../lib/midi';

function ScaleSelector () {
    const handleScaleChange = (event) => {
        setScaleName(event.target.value);
    };

    const [ scaleName, setScaleName ] = useAtom( scaleNameAtom );
    const [ , setScaleNotes ] = useAtom( scaleNotesAtom );

    useEffect(() => {
        setScaleNotes( 
            Scale.get(scaleName).notes
         );
    }, [ scaleName, setScaleNotes ] );
    
    return (
        <select className='padded' onChange={handleScaleChange} value={scaleName}>
            {ScaleType.names().sort().map(scaleName => (
                <option key={scaleName} value={scaleName}>{scaleName}</option>
            ))}
        </select>
    );
}

export default ScaleSelector;
