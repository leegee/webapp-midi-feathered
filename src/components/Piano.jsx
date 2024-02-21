// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import styles from './Piano.module.css';

// Piano Key Component
const PianoKey = ( { pitch, isHighlighted } ) => {
    return (
        <div className={`${styles['piano-key']} ${isHighlighted ? styles['piano-key-highlighted'] : ''}`}>
            { pitch }
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
        <div className="piano-keyboard">
            { midiPitches.map( ( pitch ) => (
                <PianoKey
                    key={ pitch }
                    pitch={ pitch }
                    isHighlighted={ notesOn[ pitch ] }
                />
            ) ) }
        </div>
    );
};

PianoKeyboard.propTypes = {
    notesOn: PropTypes.object.isRequired,
};

export default PianoKeyboard;
