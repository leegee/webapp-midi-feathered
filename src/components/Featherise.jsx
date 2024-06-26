import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

// import RangeTest from './RangeTest';
import styles from './Featherise.module.css';
import Slider from './SliderInput';
import RangeInput from './RangeInput';
import { notesOnAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

const playModeTypes = {
    PROBABILITY: 1,
    ONE_NOTE: 2,
};

const INITIAL_DURATION_MS = 1000;
const MIN_BPS = 1;
const MAX_BPS = 30;
const MIN_DURATION_MS = 10;
const MAX_DURATION_MS = 10000;

const userMinProb = 0;
const useMinDurationMs = 10;

export default function Featherise ( { selectedOutput } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ probabilityThreshold, setProbabilityThreshold ] = useState( 0.5 );
    const [ playMode, setPlayMode ] = useState( playModeTypes.PROBABILITY );
    const [ durationMs, setDurationMs ] = useState( INITIAL_DURATION_MS );

    const [ bpsRange, setBpsRange ] = useState( { minValue: MIN_BPS, maxValue: MAX_BPS } );

    const handleBpsRangeChange = ( e ) => {
        const newRange = {
            minValue: Math.floor( Number( e.target.minValue !== undefined ? e.target.minValue : bpsRange.minValue ) ),
            maxValue: Math.floor( Number( e.target.maxValue !== undefined ? e.target.maxValue : bpsRange.maxValue ) ),
        };
        setBpsRange( newRange );
        console.log( `Selected Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    // const handleChangeBps = ( event ) => {
    //     setBps( Math.floor( Number( event.target.value ) ) );
    // };

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
        let bpsTimer;

        function bpsListener () {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }

            const useDurationMs = useMinDurationMs + Math.random() * ( durationMs - MIN_DURATION_MS );

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
                    if ( probability < probabilityThreshold ) {
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
    }, [ notesOn, playMode, probabilityThreshold, durationMs, selectedOutput, bpsRange.minValue, bpsRange.maxValue ] );

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
                    Duration: { Math.floor( durationMs ) } ms
                </label>
                <Slider
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
                    <Slider
                        min={ 0 }
                        max={ 1 }
                        value={ probabilityThreshold }
                        onChange={ handleProbabilityChange }
                    />
                ) }
            </div>

            {/* <RangeTest /> */ }

        </section>
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};
