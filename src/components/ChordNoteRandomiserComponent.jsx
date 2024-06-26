import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import styles from './ChordNoteRandomiserComponent.module.css';
import RangeInput from './RangeInput';
import { notesOnAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

const INITIAL_BPS = 6;
const durationMs = 1000;

const playModeTypes = {
    PROBABILITY: 1,
    ONE_NOTE: 2,
};

ChordNoteRandomiserComponent.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};

export default function ChordNoteRandomiserComponent ( { selectedOutput } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ bps, setBps ] = useState( INITIAL_BPS );
    const [ playMode, setPlayMode ] = useState( playModeTypes.PROBABILITY ); 
    const [ probabilityThreshold, setProbabilityThreshold ] = useState( 0.5 );

    const handleChangeBps = ( event ) => {
        setBps( Number( event.target.value ) );
    };

    const handlePlayModeChange = ( event ) => {
        const newValue = event.target.checked ? playModeTypes.ONE_NOTE : playModeTypes.PROBABILITY;
        setPlayMode( newValue );
    };

    const handleProbabilityChange = ( event ) => {
        setProbabilityThreshold( Number( event.target.value ) );
    };

    useEffect( () => {
        function bpsListener () {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }
    
            if ( playMode === playModeTypes.ONE_NOTE ) {
                // Always play one random note
                const pitch = pitches[ Math.floor( Math.random() * pitches.length ) ];
                sendNoteWithDuration(
                    pitch,
                    notesOn[ pitch ].velocity,
                    durationMs,
                    selectedOutput
                );
            } else if ( playMode === playModeTypes.PROBABILITY ) {
                // Iterate through all notes based on the probability threshold
                Object.keys( notesOn ).forEach( ( pitch ) => {
                    const probability = Math.random(); 
                    if ( probability < probabilityThreshold ) {
                        sendNoteWithDuration(
                            pitch,
                            notesOn[ pitch ].velocity,
                            durationMs,
                            selectedOutput
                        );
                    }
                } );
            }
        }
    
        const bpsInterval = 1000 / bps;
        const bpsTimer = setInterval( bpsListener, bpsInterval );
        return () => clearInterval( bpsTimer );
    }, [bps, notesOn, playMode, probabilityThreshold, selectedOutput] );

    return (
        <section className="padded">
            <h2>Chord-note Randomiser</h2>

            <div className={ styles.row }>
                <label htmlFor="bps-input">
                    Notes per second:
                </label>
                <RangeInput
                    min={ 1 }
                    max={ 10 }
                    value={ bps }
                    onChange={ handleChangeBps }
                />
            </div>

            <div className={ styles.row }>
                <label>
                    <input
                        type="checkbox"
                        checked={ playMode === playModeTypes.ONE_NOTE }
                        onChange={ handlePlayModeChange }
                    />
                    Monophonic
                </label>
            </div>

            { playMode === playModeTypes.PROBABILITY && (
                <div className={ styles.row }>
                    <label htmlFor="probability-input" title="Probability threshold">Probability Threshold</label>
                    <RangeInput
                        min={ 0 }
                        max={ 1 }
                        value={ probabilityThreshold }
                        onChange={ handleProbabilityChange }
                    />
                </div>
            ) }

        </section>
    );
}
