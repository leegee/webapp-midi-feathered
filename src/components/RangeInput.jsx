import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './RangeInput.module.css';

function debounce ( func, delay ) {
    let timeoutId;
    return function ( ...args ) {
        if ( timeoutId ) {
            clearTimeout( timeoutId );
        }
        timeoutId = setTimeout( () => {
            func( ...args );
        }, delay );
    };
}
const RangeInput = ( { min, max, minValue, maxValue, onChange, debounceMs = 50 } ) => {
    const [ minPercentage, setMinPercentage ] = useState( ( ( minValue - min ) / ( max - min ) ) * 100 );
    const [ maxPercentage, setMaxPercentage ] = useState( ( ( maxValue - min ) / ( max - min ) ) * 100 );

    useEffect( () => {
        setMinPercentage( ( ( minValue - min ) / ( max - min ) ) * 100 );
        setMaxPercentage( ( ( maxValue - min ) / ( max - min ) ) * 100 );
    }, [ minValue, maxValue, min, max ] );

    // Debounce logic
    const debounceTimeout = useRef( null );

    const debouncedOnChange = useRef(
        debounce( ( newValues ) => {
            onChange( newValues );
        }, debounceMs )
    ).current;

    function handleDebouncedChange ( newValues ) {
        if ( debounceTimeout.current ) {
            clearTimeout( debounceTimeout.current );
        }
        debounceTimeout.current = setTimeout( () => {
            debouncedOnChange( newValues );
        }, debounceMs );
    }

    const handleResize = ( newPercentage, isMin ) => {
        newPercentage = Math.max( 0, Math.min( 100, newPercentage ) );
        if ( isMin ) {
            setMinPercentage( Math.min( newPercentage, maxPercentage - 1 ) );
            const newValue = min + ( ( max - min ) * Math.min( newPercentage, maxPercentage - 1 ) ) / 100;
            handleDebouncedChange( { minValue: newValue, maxValue } );
        } else {
            setMaxPercentage( Math.max( newPercentage, minPercentage + 1 ) );
            const newValue = min + ( ( max - min ) * Math.max( newPercentage, minPercentage + 1 ) ) / 100;
            handleDebouncedChange( { minValue, maxValue: newValue } );
        }
    };

    const handleMouseDown = ( e, isMin ) => {
        e.preventDefault( { passive: false } );
        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPercentage = ( clickX / rect.width ) * 100;
        handleResize( newPercentage, isMin );

        const handleMouseMove = ( e ) => {
            const moveX = e.clientX - rect.left;
            const newPercentage = ( moveX / rect.width ) * 100;
            handleResize( newPercentage, isMin );
        };

        const handleMouseUp = () => {
            document.removeEventListener( 'mousemove', handleMouseMove );
            document.removeEventListener( 'mouseup', handleMouseUp );
        };

        document.addEventListener( 'mousemove', handleMouseMove );
        document.addEventListener( 'mouseup', handleMouseUp );
    };

    const handleTouchStart = ( e, isMin ) => {
        e.preventDefault( { passive: true } );
        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        const touchX = e.touches[ 0 ].clientX - rect.left;
        const newPercentage = ( touchX / rect.width ) * 100;
        handleResize( newPercentage, isMin );

        const handleTouchMove = ( e ) => {
            const moveX = e.touches[ 0 ].clientX - rect.left;
            const newPercentage = ( moveX / rect.width ) * 100;
            handleResize( newPercentage, isMin );
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
            <div className={ styles.bar } style={ { left: `${ minPercentage }%`, right: `${ 100 - maxPercentage }%` } }></div>
            <div
                className={ styles.handle }
                style={ { left: `${ minPercentage }%` } }
                onMouseDown={ ( e ) => handleMouseDown( e, true ) }
                onTouchStart={ ( e ) => handleTouchStart( e, true ) }
            />
            <div
                className={ styles.handle }
                style={ { left: `${ maxPercentage }%` } }
                onMouseDown={ ( e ) => handleMouseDown( e, false ) }
                onTouchStart={ ( e ) => handleTouchStart( e, false ) }
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
