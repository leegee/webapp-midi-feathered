// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';

function NoteList ( { notesOn } ) {
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

NoteList.propTypes = {
    notesOn: PropTypes.object.isRequired,
};

export default NoteList;
