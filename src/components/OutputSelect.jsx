// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';

function OutputSelect({ midiOutputs, selectedOutput, setSelectedOutput }) {
    const handleOutputChange = (event) => {
        setSelectedOutput(event.target.value);
    };

    return (
        <select className='padded' onChange={handleOutputChange} value={selectedOutput}>
            {midiOutputs.map(output => (
                <option key={output.id} value={output.id}>{output.name}</option>
            ))}
        </select>
    );
}

OutputSelect.propTypes = {
    midiOutputs: PropTypes.array.isRequired,
    selectedOutput: PropTypes.number.isRequired, 
    setSelectedOutput: PropTypes.func.isRequired,
};

export default OutputSelect;
