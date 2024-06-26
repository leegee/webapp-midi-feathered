import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './RangeInput.module.css';

const RangeInput = ( { min, max, value, onChange } ) => {
  const [ percentage, setPercentage ] = useState( ( ( value - min ) / ( max - min ) ) * 100 );

  useEffect( () => {
    const newPercentage = ( ( value - min ) / ( max - min ) ) * 100;
    setPercentage( newPercentage );
  }, [ value, min, max ] );

  const handleResize = ( newPercentage ) => {
    newPercentage = Math.max( 0, Math.min( 100, newPercentage ) );
    setPercentage( newPercentage );

    const newValue = min + ( ( max - min ) * newPercentage ) / 100;
    onChange( { target: { value: newValue } } );
  };

  const handleMouseDown = ( e ) => {
    e.preventDefault();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercentage = ( clickX / rect.width ) * 100;
    handleResize( newPercentage );

    const handleMouseMove = ( e ) => {
      const moveX = e.clientX - rect.left;
      const newPercentage = ( moveX / rect.width ) * 100;
      handleResize( newPercentage );
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
    const newPercentage = ( touchX / rect.width ) * 100;
    handleResize( newPercentage );

    const handleTouchMove = ( e ) => {
      const moveX = e.touches[ 0 ].clientX - rect.left;
      const newPercentage = ( moveX / rect.width ) * 100;
      handleResize( newPercentage );
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
      <div className={ styles.bar } style={ { width: `${ percentage }%` } }></div>
      <div
        className={ styles.handle }
        style={ { left: `${ percentage }%` } }
        onMouseDown={ handleMouseDown }
        onTouchStart={ handleTouchStart }
      />
    </div>
  );
};

RangeInput.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RangeInput;
