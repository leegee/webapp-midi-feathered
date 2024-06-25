// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';

import {  notesOnAtom } from '../lib/store';

function NoteList ( ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [bpm, setBpm] = useState(120);

    const handleChangeBpm = (event) => {
        setBpm( event.target.value );
        console.log( 'bpm changed' );
      };

    useEffect(() => {
        console.log('bpm', bpm);
    }, [ bpm ] );
    
    useEffect( () => {
        console.log( 'notesOn', notesOn );
    }, [ notesOn ] );

    return (
        <input type='number'  value={bpm} onChange={handleChangeBpm} />
    );
}

export default NoteList;
