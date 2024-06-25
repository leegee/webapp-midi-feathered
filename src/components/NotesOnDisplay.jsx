// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useAtom } from 'jotai';

import {  notesOnAtom } from '../lib/store';

export default function NoteList ( ) {
    const [ notesOn] = useAtom( notesOnAtom );
    return (
        <ul>
            { Object.entries( notesOn ).map( ( [ key, value ] ) => (
                <li key={ key }>
                    { key }: { value.velocity } { value.timestamp } 
                </li>
            ) ) }
        </ul>
    );
}
