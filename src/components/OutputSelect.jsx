// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';

import { midiOutputsAtom, selectedOutputAtom } from '../lib/store';

function OutputSelect () {
    const [ midiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput, setSelectedOutput ] = useAtom( selectedOutputAtom );

    // Set the selected output when the component mounts
    useEffect( () => {
        if ( Object.keys( midiOutputs ).length > 0 ) {
            const focusriteOutput = Object.entries( midiOutputs ).find( ( [ , output ] ) =>
                output.name.toLowerCase().includes( 'focusrite' )
            );

            if ( focusriteOutput ) {
                setSelectedOutput( focusriteOutput[ 0 ] ); // [0] is the ID
            } else {
                // If not found, default to the last output
                setSelectedOutput( Object.keys( midiOutputs ).slice( -1 )[ 0 ] );
            }
        }
    }, [ midiOutputs, setSelectedOutput ] );

    const handleOutputChange = ( event ) => {
        console.log( 'Set output: ', event.target.value )
        setSelectedOutput( event.target.value );
    };

    return (
        <select onChange={ handleOutputChange } value={ selectedOutput }>
            { Object.entries( midiOutputs ).map( ( [ id, output ] ) => (
                <option key={ id } value={ id }>{ id } { output.name }</option>
            ) ) }
        </select>
    );
}

export default OutputSelect;
