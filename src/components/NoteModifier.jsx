/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';

import { notesOnAtom, selectedOutputAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

let durationMs = 100;

export default function NoteModifier() {
    const [notesOn] = useAtom(notesOnAtom);
    const [bps, setbps] = useState(120);
    const [ selectedOutput ] = useAtom( selectedOutputAtom );
    console.log('INIT', selectedOutput)

    const handleChangebps = (event) => {
        setbps(event.target.value);
        console.log('bps changed');
    };

    function bpsListener ( ) {
        const pitches = Object.keys(notesOn);
        if ( !pitches.length ) {
            return;
        }
    
        const pitch = pitches[ Math.floor(Math.random() * pitches.length) ];
        console.log( 'bpsListener sending notes', pitch, notesOn[ pitch ] );
    
        sendNoteWithDuration(
            pitch,
            notesOn[pitch].velocity,
            durationMs,
            window.selectedOutput // Jotai can't store?! 
        );
    }
    
    useEffect(() => {
        console.log('bps', bps);
        let bpsTimer;
        if ( bpsTimer ) {
            // Should do this and the following at the next tick
            clearInterval(bpsTimer);
        }
        console.log('Add bps listener at', bps);
        bpsTimer = setInterval(() => bpsListener(), bps);
        return () => clearInterval(bpsTimer);  
    }, [bps, notesOn]);

    return (
        <input type='number' value={bps} onChange={handleChangebps} />
    );
}
