import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import styles from './Featherise.module.css';
import RangeInput from './RangeInput';
import { notesOnAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

const playModeTypes = {
    PROBABILITY: 1,
    ONE_NOTE: 2,
};

const INITIAL_BPS = 6;
const MIN_BPS = 1;
const MAX_BPS = 30;
const MIN_DURATION_MS = 10;
const MAX_DURATION_MS = 10000;
const INITIAL_DURATION_MS = 1000;

export default function Featherise ( { selectedOutput } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ bps, setBps ] = useState( INITIAL_BPS );
    const [ playMode, setPlayMode ] = useState( playModeTypes.PROBABILITY );
    const [ probabilityThreshold, setProbabilityThreshold ] = useState( 0.5 );
    const [ durationMs, setDurationMs ] = useState( INITIAL_DURATION_MS );

    const handleChangeBps = ( event ) => {
        setBps( Math.floor( Number( event.target.value ) ) );
    };

    const handlePlayModeChange = ( event ) => {
        const newValue = event.target.checked ? playModeTypes.PROBABILITY : playModeTypes.ONE_NOTE;
        setPlayMode( newValue );
    };

    const handleProbabilityChange = ( event ) => {
        setProbabilityThreshold( Number( event.target.value ) );
    };

    const handleDurationChange = ( event ) => {
        setDurationMs( Number( event.target.value ) );
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
    }, [ bps, notesOn, playMode, probabilityThreshold, durationMs, selectedOutput ] );

    return (
        <section className="padded">
            <h2>Feathered Chords</h2>

            <div className={ styles.row }>
                <label htmlFor="bps-input">{ bps } notes per second:</label>
                <RangeInput
                    min={ MIN_BPS }
                    max={ MAX_BPS }
                    value={ bps }
                    onChange={ handleChangeBps }
                />
            </div>

            <div className={ styles.row }>
                <label htmlFor="duration-input">
                    Duration: { Math.floor( durationMs ) } ms
                </label>
                <RangeInput
                    min={ MIN_DURATION_MS }
                    max={ MAX_DURATION_MS }
                    value={ durationMs }
                    onChange={ handleDurationChange }
                />
            </div>

            <div className={ styles.row }>
                <label htmlFor="probability-input" title="Probability threshold">
                    <input
                        type="checkbox"
                        checked={ playMode === playModeTypes.PROBABILITY }
                        onChange={ handlePlayModeChange }
                    />
                    Probability Threshold

                    { playMode === playModeTypes.PROBABILITY && (
                        <> &nbsp;
                            { Math.floor( probabilityThreshold * 100 ) }%
                        </>
                    ) }
                </label>

                { playMode === playModeTypes.PROBABILITY && (
                    <RangeInput
                        min={ 0 }
                        max={ 1 }
                        value={ probabilityThreshold }
                        onChange={ handleProbabilityChange }
                    />
                ) }
            </div>

        </section>
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};
