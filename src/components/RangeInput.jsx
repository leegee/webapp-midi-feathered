import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './RangeInput.module.css';

const RangeInput = ( { min, max, minValue, maxValue, onChange, debounceMs = 100 } ) => {
    const [ minPercentage, setMinPercentage ] = useState( calculatePercentage( minValue, min, max ) );
    const [ maxPercentage, setMaxPercentage ] = useState( calculatePercentage( maxValue, min, max ) );

    const debounceTimeout = useRef( null );

    useEffect( () => {
        setMinPercentage( calculatePercentage( minValue, min, max ) );
        setMaxPercentage( calculatePercentage( maxValue, min, max ) );
    }, [ minValue, maxValue, min, max ] );

    const handleResize = ( newMinPercentage, newMaxPercentage ) => {
        newMinPercentage = Math.max( 0, Math.min( newMaxPercentage, newMinPercentage ) );
        newMaxPercentage = Math.max( newMinPercentage, Math.min( 100, newMaxPercentage ) );

        setMinPercentage( newMinPercentage );
        setMaxPercentage( newMaxPercentage );

        const newMinValue = calculateValueFromPercentage( newMinPercentage, min, max );
        const newMaxValue = calculateValueFromPercentage( newMaxPercentage, min, max );

        if ( debounceMs > 0 ) {
            if ( debounceTimeout.current ) {
                clearTimeout( debounceTimeout.current );
            }
            debounceTimeout.current = setTimeout( () => {
                onChange( { minValue: newMinValue, maxValue: newMaxValue } );
            }, debounceMs );
        } else {
            onChange( { minValue: newMinValue, maxValue: newMaxValue } );
        }
    };

    const handleMouseDown = ( e ) => {
        e.preventDefault();
        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newMinPercentage = ( clickX / rect.width ) * 100;
        handleResize( newMinPercentage, maxPercentage );

        const handleMouseMove = ( e ) => {
            const moveX = e.clientX - rect.left;
            const newMinPercentage = ( moveX / rect.width ) * 100;
            handleResize( newMinPercentage, maxPercentage );
        };

        const handleMouseUp = () => {
            document.removeEventListener( 'mousemove', handleMouseMove );
            document.removeEventListener( 'mouseup', handleMouseUp );
        };

        document.addEventListener( 'mousemove', handleMouseMove );
        document.addEventListener( 'mouseup', handleMouseUp );
    };

    const handleTouchStart = ( e ) => {
        e.preventDefault();
        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        const touchX = e.touches[ 0 ].clientX - rect.left;
        const newMinPercentage = ( touchX / rect.width ) * 100;
        handleResize( newMinPercentage, maxPercentage );

        const handleTouchMove = ( e ) => {
            const moveX = e.touches[ 0 ].clientX - rect.left;
            const newMinPercentage = ( moveX / rect.width ) * 100;
            handleResize( newMinPercentage, maxPercentage );
        };

        const handleTouchEnd = () => {
            document.removeEventListener( 'touchmove', handleTouchMove );
            document.removeEventListener( 'touchend', handleTouchEnd );
        };

        document.addEventListener( 'touchmove', handleTouchMove );
        document.addEventListener( 'touchend', handleTouchEnd );
    };

    return (
        <div className={ styles[ 'custom-range-input' ] }>
            <div className={ styles.bar } style={ { left: `${ minPercentage }%`, width: `${ maxPercentage - minPercentage }%` } }></div>
            <div
                className={ styles.handle }
                style={ { left: `${ minPercentage }%` } }
                onMouseDown={ handleMouseDown }
                onTouchStart={ handleTouchStart }
            />
            <div
                className={ styles.handle }
                style={ { left: `${ maxPercentage }%` } }
                onMouseDown={ handleMouseDown }
                onTouchStart={ handleTouchStart }
            />
        </div>
    );
};

RangeInput.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    debounceMs: PropTypes.number,
};

export default RangeInput;

// Helper functions

function calculatePercentage ( value, min, max ) {
    return ( ( value - min ) / ( max - min ) ) * 100;
}

function calculateValueFromPercentage ( percentage, min, max ) {
    return min + ( ( max - min ) * percentage ) / 100;
}
