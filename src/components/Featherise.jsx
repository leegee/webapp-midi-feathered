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

const MIN_BPS = 1;
const MAX_BPS = 30;
const MIN_DURATION_MS = 10;
const MAX_DURATION_MS = 10000;

const userMinProb = 0;
const useMinDurationMs = 10;

export default function Featherise ( { selectedOutput } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ probabilityThresholdRange, setProbabilityThresholdRange ] = useState( { minValue: 0, maxValue: 1 } );
    const [ playMode, setPlayMode ] = useState( playModeTypes.PROBABILITY );
    const [ bpsRange, setBpsRange ] = useState( { minValue: MIN_BPS, maxValue: MAX_BPS } );
    const [ durationRange, setDurationRange ] = useState( { minValue: MIN_DURATION_MS, maxValue: MAX_DURATION_MS } );

    const handleBpsRangeChange = ( event ) => {
        const newRange = {
            minValue: Math.floor( Number( event.target.minValue !== undefined ? event.target.minValue : bpsRange.minValue ) ),
            maxValue: Math.floor( Number( event.target.maxValue !== undefined ? event.target.maxValue : bpsRange.maxValue ) ),
        };
        setBpsRange( newRange );
    };

    const handleDurationRangeChange = ( event ) => {
        setDurationRange( {
            minValue: Math.floor( Number( event.target.minValue ) ),
            maxValue: Math.floor( Number( event.target.maxValue ) ),
        } );
    };

    const handleProbabilityThresholdRangeChange = ( event ) => {
        setProbabilityThresholdRange( {
            minValue: Number( event.target.minValue ),
            maxValue: Number( event.target.maxValue ),
        } );
    };

    const handlePlayModeChange = ( event ) => {
        setPlayMode( event.target.checked ? playModeTypes.PROBABILITY : playModeTypes.ONE_NOTE );
    };

    useEffect( () => {
        let bpsTimer;

        function bpsListener () {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }

            const useDurationMs = useMinDurationMs + Math.random() * ( durationRange.maxValue - durationRange.minValue );

            if ( playMode === playModeTypes.ONE_NOTE ) {
                // Always play one random note
                const pitch = pitches[ Math.floor( Math.random() * pitches.length ) ];
                sendNoteWithDuration(
                    pitch,
                    notesOn[ pitch ].velocity,
                    useDurationMs,
                    selectedOutput
                );
            } else if ( playMode === playModeTypes.PROBABILITY ) {
                // Iterate through all notes based on the probability threshold
                Object.keys( notesOn ).forEach( ( pitch ) => {
                    const probability = userMinProb + ( 1 - userMinProb ) * Math.random();
                    if ( probability < probabilityThresholdRange.maxValue && probability > probabilityThresholdRange.minValue ) {
                        sendNoteWithDuration(
                            pitch,
                            notesOn[ pitch ].velocity,
                            useDurationMs,
                            selectedOutput
                        );
                    }
                } );
            }

            // Set the next recursion:
            const bpsIntervalMin = 1000 / bpsRange.minValue;
            const bpsIntervalMax = 1000 / bpsRange.maxValue;
            const bpsInterval = bpsIntervalMin + Math.random() * ( bpsIntervalMax - bpsIntervalMin );
            bpsTimer = setTimeout( bpsListener, bpsInterval );
        }

        // Begin  the recursion:
        bpsListener();

        return () => clearTimeout( bpsTimer );
    }, [ notesOn, playMode, probabilityThresholdRange, durationRange, selectedOutput, bpsRange.minValue, bpsRange.maxValue ] );

    return (
        <section className="padded">
            <h2>Feathered Chords</h2>

            <div className={ styles.row }>
                <label htmlFor="bps-input">{ bpsRange.minValue }-{ bpsRange.maxValue } notes per second:</label>
                <RangeInput
                    id='bps-input'
                    min={ MIN_BPS }
                    max={ MAX_BPS }
                    minValue={ bpsRange.minValue }
                    maxValue={ bpsRange.maxValue }
                    onChange={ handleBpsRangeChange }
                />
            </div>

            <div className={ styles.row }>
                <label htmlFor="duration-input">
                    Duration Range: { Math.floor( durationRange.minValue ) } ms - { Math.floor( durationRange.maxValue ) } ms
                </label>
                <RangeInput
                    id='duration-input'
                    min={ MIN_DURATION_MS }
                    max={ MAX_DURATION_MS }
                    minValue={ durationRange.minValue }
                    maxValue={ durationRange.maxValue }
                    onChange={ handleDurationRangeChange }
                />
            </div>

            <div className={ styles.row }>
                <label htmlFor="probability-input" title="Probability threshold range">
                    <input
                        type="checkbox"
                        checked={ playMode === playModeTypes.PROBABILITY }
                        onChange={ handlePlayModeChange }
                    />
                    Probability Threshold Range
                </label>
                { playMode === playModeTypes.PROBABILITY && (
                    <RangeInput
                        min={ 0 }
                        max={ 1 }
                        minValue={ probabilityThresholdRange.minValue }
                        maxValue={ probabilityThresholdRange.maxValue }
                        onChange={ handleProbabilityThresholdRangeChange }
                    />
                ) }
            </div>
        </section>
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};
