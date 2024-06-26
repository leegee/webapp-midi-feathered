import { useState } from 'react';
import RangeInput from './RangeInput';

const RangeSelector = () => {
    const [ range, setRange ] = useState( { minValue: 10, maxValue: 90 } );

    const handleRangeChange = ( e ) => {
        const newRange = {
            minValue: e.target.minValue !== undefined ? e.target.minValue : range.minValue,
            maxValue: e.target.maxValue !== undefined ? e.target.maxValue : range.maxValue,
        };
        setRange( newRange );
        console.log( `Selected Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    return (
        <div>
            <h1>Range Selector</h1>
            <RangeInput
                min={ 0 }
                max={ 100 }
                minValue={ range.minValue }
                maxValue={ range.maxValue }
                onChange={ handleRangeChange }
            />
            <p>Selected Range: Min = { range.minValue }, Max = { range.maxValue }</p>
        </div>
    );
};

export default RangeSelector;
