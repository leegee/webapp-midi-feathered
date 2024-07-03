import { useAtom } from 'jotai';

import { notesOnAtom } from '../lib/store';

export default function NoteList () {
    const [ notesOn ] = useAtom( notesOnAtom );
    return (
        <ul>
            { Object.entries( notesOn ).map( ( [ key, value ] ) => (
                <li key={ key }>
                    { key }: { value }
                </li>
            ) ) }
        </ul>
    );
}
