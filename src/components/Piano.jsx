import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { notesOnAtom } from '../lib/store';

import styles from './Piano.module.css';

const blackKeys = [ 1, 3, 6, 8, 10 ];

const PianoKey = ( { pitch, isHighlighted } ) => {
    const isBlackKey = blackKeys.includes( pitch % 12 );

    return (
        <div
            alt={ `${ pitch }` }
            className={ `${ styles[ 'piano-key' ] } ${ isHighlighted ? styles[ 'piano-key-highlighted' ] : '' } ${ isBlackKey ? styles[ 'piano-key-black' ] : 'piano-key-white' }` }>
        </div>
    );
};

PianoKey.propTypes = {
    pitch: PropTypes.number.isRequired,
    isHighlighted: PropTypes.bool.isRequired,
};

export default function PianoKeyboard () {
    const [ notesOn ] = useAtom( notesOnAtom );

    // 88 keys from A0 @ MIDI pitch 21
    const midiPitches = Array.from( { length: 88 }, ( _, index ) => index + 21 );

    return (
        <section className={ styles[ 'piano-keyboard' ] }>
            <div>
                { midiPitches.map( ( pitch ) => (
                    <PianoKey
                        key={ pitch }
                        pitch={ pitch }
                        isHighlighted={ notesOn[ pitch ] ? true : false }
                    />
                ) ) }
            </div>
        </section>
    );
}
