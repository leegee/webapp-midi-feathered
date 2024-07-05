/* Dialog.jsx */
// components/Dialog.js
import { useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Dialog.module.css';

export default function Dialog ( { isOpen, onClose, children } ) {
    const dialogRef = useRef( null );

    if ( isOpen && dialogRef.current ) {
        dialogRef.current.showModal();
    } else if ( dialogRef.current ) {
        dialogRef.current.close();
    }

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

