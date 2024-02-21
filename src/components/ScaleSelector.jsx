// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';

import { ScaleType } from "tonal";

function ScaleSelector ({ scaleName, setScaleName }) {
    const handleScaleChange = (event) => {
        setScaleName(event.target.value);
    };

    return (
        <select onChange={handleScaleChange} value={scaleName}>
            {ScaleType.names().sort().map(scaleName => (
                <option key={scaleName} value={scaleName}>{scaleName}</option>
            ))}
        </select>
    );
}

ScaleSelector.propTypes = {
    scaleName: PropTypes.string.isRequired, 
    setScaleName: PropTypes.func.isRequired,
};

export default ScaleSelector;
