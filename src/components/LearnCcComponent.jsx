import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { CCsAtom } from '../lib/store';

import styles from './LearnCcComponent.module.css';

export default function LearnCcComponent ( { onChange } ) {
    const [ localLearningCC, setLocalLearningCC ] = useState( false );
    const [ CCs ] = useAtom( CCsAtom );
    const prevCCsRef = useRef( CCs );

    const handleClick = () => setLocalLearningCC( !localLearningCC );

    useEffect( () => {
        if ( localLearningCC ) {
            if ( prevCCsRef.current !== CCs ) {
                setLocalLearningCC( false );
                console.log( 'CCs changed:', CCs );
                onChange( Object.keys( CCs )[ 0 ] );
                prevCCsRef.current = CCs;
            }
        }
    }, [ CCs, localLearningCC, onChange ] );

    return (
        <span className={ styles.learnButton } onClick={ handleClick } title='MIDI Learn CC'>
            { localLearningCC ? <>Cancel</> : <>Learn</> }
        </span>
    );
}

LearnCcComponent.propTypes = {
    onChange: PropTypes.func.isRequired,
};
