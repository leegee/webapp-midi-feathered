/* Dialog.jsx */
// components/Dialog.js
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Dialog.module.css';

export default function Dialog ( { isOpen, onClose, children } ) {
    const dialogRef = useRef( null );

    if ( isOpen && dialogRef.current ) {
        dialogRef.current.showModal();
    } else if ( dialogRef.current ) {
        dialogRef.current.close();
    }

    useEffect( () => {
        if ( isOpen && dialogRef.current ) {
            const dialogRefCurrent = dialogRef.current;
            const onCancel = () => {
                console.log( 'Dialog canceled (ESC key pressed or outside click)' );
                onClose();
            };

            dialogRefCurrent.addEventListener( 'cancel', onCancel );
            return () => dialogRefCurrent.removeEventListener( 'cancel', onCancel );
        }
    }, [ dialogRef, isOpen, onClose ] );

    return (
        <dialog ref={ dialogRef } className={ styles.dialog }>
            <button className={ styles.close } onClick={ onClose } title='Close'>×</button>
            { children }
        </dialog>
    );
}

Dialog.propTypes = {
    vertical: PropTypes.bool,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.arrayOf( PropTypes.element ).isRequired
};

