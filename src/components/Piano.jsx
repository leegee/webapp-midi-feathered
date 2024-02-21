// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';

import styles from './Piano.module.css';

const blackKeys = [1, 3, 6, 8, 10];

// Piano Key Component
const PianoKey = ( { pitch, isHighlighted } ) => {
    const isBlackKey = blackKeys.includes(pitch % 12);

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
  
const PianoKeyboard = ( { notesOn } ) => {
    // MIDI note numbers typically start at 21
    const midiPitches = Array.from( { length: 88 }, ( _, index ) => index + 21 ); 

    return (
        <aside className="piano-keyboard padded">
            { midiPitches.map( ( pitch ) => (
                <PianoKey
                    key={ pitch }
                    pitch={ pitch }
                    isHighlighted={ notesOn[ pitch ] ? true : false }
                />
            ) ) }
        </aside>
    );
};

PianoKeyboard.propTypes = {
    notesOn: PropTypes.object.isRequired,
};

export default PianoKeyboard;
