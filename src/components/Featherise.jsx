import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { sendNoteWithDuration } from '../lib/midi-messages';
import { notesOnAtom, midiOutputChannelAtom } from '../lib/store';
import RangeInput from './RangeInput';
import styles from './Featherise.module.css';

const playModeTypes = {
    PROBABILITY: 1,
    ONE_NOTE: 2,
};

const MIN_BPS = 1;
const MAX_BPS = 30;
const MIN_DURATION_MS = 10;
const MAX_DURATION_MS = 10000;

export default function Featherise ( { selectedOutput } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ midiOutputChannel ] = useAtom( midiOutputChannelAtom );

    const [ playMode, setPlayMode ] = useState( playModeTypes.PROBABILITY );
    const [ probabilityThresholdRange, setProbabilityThresholdRange ] = useState( { minValue: 0, maxValue: 1 } );
    const [ bpsRange, setBpsRange ] = useState( { minValue: MIN_BPS, maxValue: MAX_BPS } );
    const [ durationRange, setDurationRange ] = useState( { minValue: MIN_DURATION_MS, maxValue: MAX_DURATION_MS } );

    const handleBpsRangeChange = ( newRange ) => {
        setBpsRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : bpsRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : bpsRange.maxValue ) ),
        } );
        console.log( `Selected BPS Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleDurationRangeChange = ( newRange ) => {
        setDurationRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        console.log( `Selected Duration Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleProbabilityThresholdRangeChange = ( newRange ) => {
        setProbabilityThresholdRange( {
            minValue: Number( newRange.minValue ),
            maxValue: Number( newRange.maxValue ),
        } );
        console.log( `Selected Probability Threshold Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handlePlayModeChange = ( event ) => {
        setPlayMode(
            event.target.checked ? playModeTypes.PROBABILITY : playModeTypes.ONE_NOTE
        );
    };

    useEffect( () => {
        let bpsTimer;

        function bpsListener () {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }

            const useDurationMs = durationRange.minValue + Math.random() * ( durationRange.maxValue - durationRange.minValue );

            if ( playMode === playModeTypes.ONE_NOTE ) {
                // Always play one random note
                const pitch = pitches[ Math.floor( Math.random() * pitches.length ) ];
                sendNoteWithDuration(
                    pitch,
                    notesOn[ pitch ].velocity,
                    useDurationMs,
                    selectedOutput,
                    midiOutputChannel
                );
            }

            else if ( playMode === playModeTypes.PROBABILITY ) {
                // Mabye play some of the notes:
                Object.keys( notesOn ).forEach( ( pitch ) => {
                    const probability = Math.random();
                    if ( probability < probabilityThresholdRange.maxValue && probability > probabilityThresholdRange.minValue ) {
                        sendNoteWithDuration(
                            pitch,
                            notesOn[ pitch ].velocity,
                            useDurationMs,
                            selectedOutput,
                            midiOutputChannel
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
    }, [ notesOn, playMode, probabilityThresholdRange, durationRange, selectedOutput, bpsRange.minValue, bpsRange.maxValue, midiOutputChannel ] );

    return (
        <fieldset className={ `padded ${ styles.fieldset }` }>
            <legend className={ styles.legend }>Feathered Chords</legend>

            <div className={ styles.row }>
                <label htmlFor="bps-input">
                    { bpsRange.minValue }-{ bpsRange.maxValue } notes per second:
                </label>
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
        </fieldset>
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};
