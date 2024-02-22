// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useAtom } from 'jotai';

import {  midiOutputsAtom, selectedOutputAtom } from '../lib/midi';

function OutputSelect () {
    const [ midiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput, setSelectedOutput ] = useAtom( selectedOutputAtom );

    const handleOutputChange = ( event ) => {
        console.log('Set output: ', event.target.value)
        setSelectedOutput( event.target.value );
    };

    return (
        <select className='padded' onChange={handleOutputChange} value={selectedOutput}>
            {Object.entries(midiOutputs).map(([id, output]) => (
                <option key={id} value={id}>{id} {output.name}</option>
            ))}
        </select>
    );
}

export default OutputSelect;
