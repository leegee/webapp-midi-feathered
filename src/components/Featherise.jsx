import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { sendNoteWithDuration } from '../lib/midi-messages';
import { notesOnAtom, featheredNotesOnAtom, midiOutputChannelAtom } from '../lib/store';
import RangeInput from './RangeInput';
import { loadJson, saveJson } from '../lib/settings-files';
import styles from './Featherise.module.css';

const playModeTypes = {
    PROBABILITY: 1,
    ONE_NOTE: 2,
};

const MIN_BPS = 1;
const MAX_BPS = 30;
const MIN_VELOCITY_PC = -100;
const MAX_VELOCITY_PC = 100;
const MIN_SPEED_MS = 10;
const MAX_SPEED_MS = 10000;
const MIN_DURATION_MS = 10;
const MAX_DURATION_MS = 5000;

export default function Featherise ( { selectedOutput, vertical = false } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ , setFeatheredNotesOn ] = useAtom( featheredNotesOnAtom );
    const [ midiOutputChannel ] = useAtom( midiOutputChannelAtom );

    const [ playMode, setPlayMode ] = useState( playModeTypes.PROBABILITY );
    const [ probabilityThresholdRange, setProbabilityThresholdRange ] = useState( { minValue: 0, maxValue: 1 } );
    const [ durationRange, setDurationRange ] = useState( { minValue: MIN_DURATION_MS, maxValue: MAX_DURATION_MS } );
    const [ velocityRange, setVelocityRange ] = useState( { minValue: MIN_VELOCITY_PC, maxValue: MAX_VELOCITY_PC } );
    const [ bpsRange, setBpsRange ] = useState( { minValue: MIN_BPS, maxValue: MAX_BPS } );
    const [ speedRange, setSpeedRange ] = useState( { minValue: MIN_SPEED_MS, maxValue: MAX_SPEED_MS } );

    const handleBpsRangeChange = ( newRange ) => {
        setBpsRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : bpsRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : bpsRange.maxValue ) ),
        } );
        console.log( `Selected BPS Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleVelocityRangeChange = ( newRange ) => {
        setVelocityRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : velocityRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : velocityRange.maxValue ) ),
        } );
        console.log( `Selected velocity range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleSpeedRangeChange = ( newRange ) => {
        setSpeedRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        console.log( `Selected Speed Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
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

    const percentage = ( real ) => Math.floor( real * 100 );

    const save = () => {
        saveJson( {
            bpsRange: {
                minValue: bpsRange.minValue,
                maxValue: bpsRange.maxValue,
            },
            velocityRange: {
                minValue: velocityRange.minValue,
                maxValue: velocityRange.maxValue,
            },
            speedRange: {
                minValue: speedRange.minValue,
                maxValue: speedRange.maxValue,
            },
            durationRange: {
                minValue: durationRange.minValue,
                maxValue: durationRange.maxValue,
            },
            probabilityThresholdRange: {
                minValue: probabilityThresholdRange.minValue,
                maxValue: probabilityThresholdRange.maxValue,
            },
        } );
    }

    const load = async () => {
        try {
            const settings = await loadJson();
            console.log( settings );
            setBpsRange( settings.bpsRange );
            setVelocityRange( settings.velocityRange );
            setSpeedRange( settings.speedRange );
            setDurationRange( settings.durationRange );
            setProbabilityThresholdRange( settings.probabilityThresholdRange );
        } catch ( e ) {
            alert( e );
        }
    }

    // Returns an adjusted velocity clamped to valid MIDI values
    const generateVelocity = ( velocity ) => {
        return Math.min(
            Math.max(
                ( velocity * ( 1 + Math.random() * ( MAX_VELOCITY_PC - MIN_VELOCITY_PC ) + MIN_VELOCITY_PC / 100 ) ),
                0
            ),
            127
        );
    }

    useEffect( () => {
        let bpsTimer;

        const bpsListener = () => {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }

            const useDurationMs = speedRange.minValue + Math.random() * ( speedRange.maxValue - speedRange.minValue );

            if ( playMode === playModeTypes.ONE_NOTE ) {
                // Always play one random note
                const pitch = pitches[ Math.floor( Math.random() * pitches.length ) ];
                const velocity = generateVelocity( notesOn[ pitch ].velocity );

                sendNoteWithDuration(
                    pitch,
                    velocity,
                    useDurationMs,
                    selectedOutput,
                    midiOutputChannel
                );
                setFeatheredNotesOn( {
                    [ pitch ]: { velocity }
                } );
            }

            else { // if ( playMode === playModeTypes.PROBABILITY ) {
                // Mabye play some of the notes:
                const playingPitch2velocity = {};
                Object.keys( notesOn ).forEach( ( pitch ) => {
                    const probability = Math.random();
                    if ( probability < probabilityThresholdRange.maxValue && probability > probabilityThresholdRange.minValue ) {
                        const velocity = generateVelocity( notesOn[ pitch ].velocity );
                        sendNoteWithDuration(
                            pitch,
                            velocity,
                            useDurationMs,
                            selectedOutput,
                            midiOutputChannel
                        );
                        playingPitch2velocity[ pitch ] = { velocity };
                        setFeatheredNotesOn( { ...playingPitch2velocity } );
                    }
                } );
            }

            // Set the next recursion:
            const bpsIntervalMin = 1000 / bpsRange.minValue;
            const bpsIntervalMax = 1000 / bpsRange.maxValue;
            const bpsInterval = bpsIntervalMin + Math.random() * ( bpsIntervalMax - bpsIntervalMin );
            bpsTimer = setTimeout( bpsListener, bpsInterval );
        }

        // Begin the recursion:
        bpsListener();

        return () => clearTimeout( bpsTimer );
    }, [
        notesOn, playMode, probabilityThresholdRange, speedRange, selectedOutput,
        bpsRange.minValue, bpsRange.maxValue, midiOutputChannel, setFeatheredNotesOn
    ] );

    return (
        <fieldset className={ `padded ${ styles.fieldset }` }>
            <legend className={ styles.legend }>
                Feathered Chords
                <span className={ styles.settings }>
                    <button onClick={ load }>Load</button>
                    <button onClick={ save }>Save</button>
                </span>
            </legend>

            <div className={ vertical ? styles.vertical : '' }>
                <div className={ styles.row }>
                    <label htmlFor="bps-input">
                        { bpsRange.minValue }-{ bpsRange.maxValue } notes per second
                    </label>
                    <RangeInput vertical={ vertical }
                        id='bps-input'
                        min={ MIN_BPS }
                        max={ MAX_BPS }
                        minValue={ bpsRange.minValue }
                        maxValue={ bpsRange.maxValue }
                        onChange={ handleBpsRangeChange }
                    />
                </div>

                <div className={ styles.row }>
                    <label htmlFor="velocity-input">
                        Velocity variation: { velocityRange.minValue }-{ velocityRange.maxValue } %
                    </label>
                    <RangeInput vertical={ vertical }
                        id='velocity-input'
                        min={ MIN_VELOCITY_PC }
                        max={ MAX_VELOCITY_PC }
                        minValue={ velocityRange.minValue }
                        maxValue={ velocityRange.maxValue }
                        onChange={ handleVelocityRangeChange }
                    />
                </div>

                <div className={ styles.row }>
                    <label htmlFor="speed-input">
                        Speed: { Math.floor( speedRange.minValue ) } ms - { Math.floor( speedRange.maxValue ) } ms
                    </label>
                    <RangeInput vertical={ vertical }
                        id='speed-input'
                        min={ MIN_SPEED_MS }
                        max={ MAX_SPEED_MS }
                        minValue={ speedRange.minValue }
                        maxValue={ speedRange.maxValue }
                        onChange={ handleSpeedRangeChange }
                    />
                </div>

                <div className={ styles.row }>
                    <label htmlFor="duration-input">
                        Duration Range: { Math.floor( durationRange.minValue ) } ms - { Math.floor( durationRange.maxValue ) } ms
                    </label>
                    <RangeInput vertical={ vertical }
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
                        Probability Threshold Range:&nbsp;
                        { percentage( probabilityThresholdRange.minValue ) }-{ percentage( probabilityThresholdRange.maxValue ) }%
                    </label>
                    { playMode === playModeTypes.PROBABILITY && (
                        <RangeInput vertical={ vertical }
                            min={ 0 }
                            max={ 1 }
                            minValue={ probabilityThresholdRange.minValue }
                            maxValue={ probabilityThresholdRange.maxValue }
                            onChange={ handleProbabilityThresholdRangeChange }
                        />
                    ) }
                </div>
            </div>

        </fieldset>
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
    vertical: PropTypes.bool,
};
