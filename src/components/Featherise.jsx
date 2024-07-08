import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { sendNoteWithDuration } from '../lib/midi-messages';
import { notesOnAtom, featheredNotesOnAtom, midiOutputChannelsAtom } from '../lib/store';
import RangeInput from './RangeInput';
import { loadJson, saveJson } from '../lib/settings-files';
import styles from './Featherise.module.css';

const playModeTypes = {
    PROBABILITY: 1,
    ONE_NOTE: 2,
};

const LOCAL_SAVE_FREQ_MS = 1000 * 10;

const DEFAULT_RANGES = {
    probRange: {
        minValue: 0,
        maxValue: 1,
    },
    durationRange: {
        minValue: 2400,
        maxValue: 60000,
    },
    velocityRange: {
        minValue: -100,
        maxValue: 100,
    },
    bpsRange: {
        minValue: 1,
        maxValue: 10,
    },
    speedRange: {
        minValue: 200,
        maxValue: 6000,
    },
    octaveRange: {
        minValue: 1,
        maxValue: 5
    },
}

const localStorageOr = ( fieldName, defaultValue ) => {
    return Number( localStorage.getItem( fieldName ) ) || defaultValue;
}

const ucfirst = str => str.charAt( 0 ).toUpperCase() + str.slice( 1 );

export default function Featherise ( { selectedOutput, vertical = false } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ , setFeatheredNotesOn ] = useAtom( featheredNotesOnAtom );
    const [ midiOutputChannels ] = useAtom( midiOutputChannelsAtom );

    const rangeState = {
        playMode: localStorageOr( 'playMode', true ),
        setPlayMode: useState( playModeTypes.PROBABILITY ),
    };

    for ( let key in DEFAULT_RANGES ) {
        const setterName = 'set' + ucfirst( key );
        // eslint-disable-next-line react-hooks/rules-of-hooks
        [ rangeState[ key ], rangeState[ setterName ] ] = useState( {
            minValue: localStorageOr( key + "_minValue", DEFAULT_RANGES[ key ].minValue ),
            maxValue: localStorageOr( key + "_maxValue", DEFAULT_RANGES[ key ].maxValue ),
        } );
        console.log( `SET ${ key } ` )
    }

    // [ rangeState.probRange, rangeState.setprobRange ] = useState( defaultRanges.probRange );
    // [ rangeState.durationRange, rangeState.setDurationRange ] = useState( defaultRanges.durationRange );
    // [ rangeState.velocityRange, rangeState.setVelocityRange ] = useState( { minValue: MIN_VELOCITY_PC, maxValue: MAX_VELOCITY_PC } );
    // [ rangeState.bpsRange, rangeState.setBpsRange ] = useState( { minValue: MIN_BPS, maxValue: MAX_BPS } );
    // [ rangeState.speedRange, rangeState.setSpeedRange ] = useState( { minValue: MIN_SPEED_MS, maxValue: MAX_SPEED_MS } );
    // [ rangeState.octaveRange, rangeState.setOctaveRange ] = useState( { minValue: MIN_OCTAVE, maxValue: MAX_OCTAVE } );

    const handleBpsRangeChange = ( newRange ) => {
        rangeState.setBpsRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : rangeState.bpsRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : rangeState.bpsRange.maxValue ) ),
        } );
        console.log( `Selected BPS Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleVelocityRangeChange = ( newRange ) => {
        rangeState.setVelocityRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : rangeState.velocityRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : rangeState.velocityRange.maxValue ) ),
        } );
        console.log( `Selected velocity range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleSpeedRangeChange = ( newRange ) => {
        rangeState.setSpeedRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        console.log( `Selected Speed Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleOctaveRangeChange = ( newRange ) => {
        rangeState.setOctaveRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        console.log( `Selected Octave Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleDurationRangeChange = ( newRange ) => {
        rangeState.setDurationRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        console.log( `Selected Duration Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleprobRangeChange = ( newRange ) => {
        rangeState.setprobRange( {
            minValue: Number( newRange.minValue ),
            maxValue: Number( newRange.maxValue ),
        } );
        console.log( `Selected Probability Threshold Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handlePlayModeChange = ( event ) => {
        rangeState.setPlayMode(
            event.target.checked ? playModeTypes.PROBABILITY : playModeTypes.ONE_NOTE
        );
    };

    const percentage = ( real ) => Math.floor( real * 100 );

    const ms2bpm = ( n ) => 60000 / Number( n );

    const save = () => {
        saveJson( {
            bpsRange: {
                minValue: rangeState.bpsRange.minValue,
                maxValue: rangeState.bpsRange.maxValue,
            },
            velocityRange: {
                minValue: rangeState.velocityRange.minValue,
                maxValue: rangeState.velocityRange.maxValue,
            },
            speedRange: {
                minValue: rangeState.speedRange.minValue,
                maxValue: rangeState.speedRange.maxValue,
            },
            durationRange: {
                minValue: rangeState.durationRange.minValue,
                maxValue: rangeState.durationRange.maxValue,
            },
            probRange: {
                minValue: rangeState.probRange.minValue,
                maxValue: rangeState.probRange.maxValue,
            },
        } );
    }

    const load = async () => {
        try {
            const settings = await loadJson();
            console.log( settings );
            rangeState.setBpsRange( settings.bpsRange );
            rangeState.setVelocityRange( settings.velocityRange );
            rangeState.setSpeedRange( settings.speedRange );
            rangeState.setDurationRange( settings.durationRange );
            rangeState.setprobRange( settings.probRange );
        } catch ( e ) {
            console.error( e );
            alert( e );
        }
    }

    // Returns an adjusted velocity clamped to valid MIDI values
    const generateVelocity = ( velocity ) => {
        return Math.min(
            Math.max(
                ( velocity * ( 1 + Math.random() * (
                    DEFAULT_RANGES.velocityRange.maxValue - DEFAULT_RANGES.velocityRange.minValue
                ) + DEFAULT_RANGES.velocityRange.minValue / 100 ) ),
                0
            ),
            127
        );
    }

    // @see localStorageOr
    useEffect( () => {
        const saveIntervalTimer = setInterval( () => {
            for ( let key in DEFAULT_RANGES ) {
                console.log( key, rangeState[ key ] )
                localStorage.setItem( key + "_minValue", rangeState[ key ].minValue );
                localStorage.setItem( key + "_maxValue", rangeState[ key ].maxValue );
            }
        }, LOCAL_SAVE_FREQ_MS );
        return () => clearInterval( saveIntervalTimer );
    } );

    useEffect( () => {
        let bpsTimer;

        const bpsListener = () => {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }

            const useDurationMs = rangeState.speedRange.minValue + Math.random() * ( rangeState.speedRange.maxValue - rangeState.speedRange.minValue );

            const useOctave = 12 * (
                rangeState.octaveRange.minValue == rangeState.octaveRange.maxValue
                    ? rangeState.octaveRange.minValue
                    : rangeState.octaveRange.minValue + Math.random() * ( rangeState.octaveRange.maxValue - rangeState.octaveRange.minValue )
            ) - 1;

            const midiOutputChannel = midiOutputChannels.length == 1
                // Use the only output selected
                ? midiOutputChannels[ 0 ]
                // Use a random output channel
                : midiOutputChannels[ Math.floor( Math.random() * midiOutputChannels.length ) ];

            if ( rangeState.playMode === playModeTypes.ONE_NOTE ) {
                // Always play one random note
                const usePitch = useOctave + pitches[ Math.floor( Math.random() * pitches.length ) ];
                const useVelocity = generateVelocity( notesOn[ usePitch ] );

                sendNoteWithDuration(
                    usePitch,
                    useVelocity,
                    useDurationMs,
                    selectedOutput,
                    midiOutputChannel
                );
                setFeatheredNotesOn( {
                    [ usePitch ]: { velocity: useVelocity }
                } );
            }

            else { // if ( playMode === playModeTypes.PROBABILITY ) {
                // Mabye play some of the notes:
                const playingPitch2velocity = {};
                Object.keys( notesOn ).forEach( ( usePitch ) => {
                    const probability = Math.random();
                    if ( probability < rangeState.probRange.maxValue && probability > rangeState.probRange.minValue ) {
                        const useVelocity = generateVelocity( notesOn[ usePitch ] );
                        sendNoteWithDuration(
                            useOctave + usePitch,
                            useVelocity,
                            useDurationMs,
                            selectedOutput,
                            midiOutputChannel
                        );
                        playingPitch2velocity[ usePitch ] = { velocity: useVelocity };
                    }
                } );
                setFeatheredNotesOn( { ...playingPitch2velocity } );
            }

            // Set the next recursion:
            const bpsIntervalMin = 1000 / rangeState.bpsRange.minValue;
            const bpsIntervalMax = 1000 / rangeState.bpsRange.maxValue;
            const bpsInterval = bpsIntervalMin + Math.random() * ( bpsIntervalMax - bpsIntervalMin );
            bpsTimer = setTimeout( bpsListener, bpsInterval );
        }

        // Begin the recursion:
        bpsListener();

        return () => clearTimeout( bpsTimer );
    }, [ notesOn, rangeState.playMode, rangeState.probRange, rangeState.speedRange, selectedOutput, rangeState.bpsRange.minValue, rangeState.bpsRange.maxValue, midiOutputChannels, setFeatheredNotesOn, rangeState.octaveRange.minValue, rangeState.octaveRange.maxValue ] );

    return (
        <fieldset className={ `padded ${ styles[ 'featherize-component' ] }` }>
            <legend className={ styles.legend }>
                Feathered Chords
                <span className={ styles.settings }>
                    <button onClick={ load }>Load</button>
                    <button onClick={ save }>Save</button>
                </span>
            </legend>

            <div className={ styles[ 'play-controls' ] + ' ' + ( vertical ? styles.vertical : styles.horiztonal ) }>
                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="bps-input">
                        { rangeState.bpsRange.minValue }-{ rangeState.bpsRange.maxValue }<br />
                        notes/sec
                    </label>
                    <RangeInput vertical={ vertical }
                        id='bps-input'
                        min={ DEFAULT_RANGES.bpsRange.minValue }
                        max={ DEFAULT_RANGES.bpsRange.maxValue }
                        minValue={ rangeState.bpsRange.minValue }
                        maxValue={ rangeState.bpsRange.maxValue }
                        onChange={ handleBpsRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="velocity-input">
                        Velocity:<br />
                        { rangeState.velocityRange.minValue }-{ rangeState.velocityRange.maxValue } %
                    </label>
                    <RangeInput vertical={ vertical }
                        id='velocity-input'
                        min={ DEFAULT_RANGES.velocityRange.minValue }
                        max={ DEFAULT_RANGES.velocityRange.maxValue }
                        minValue={ rangeState.velocityRange.minValue }
                        maxValue={ rangeState.velocityRange.maxValue }
                        onChange={ handleVelocityRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="speed-input">
                        Speed:<br />
                        { Math.floor( ms2bpm( rangeState.speedRange.minValue ) ) } - { Math.floor( ms2bpm( rangeState.speedRange.maxValue ) ) } bpm
                    </label>
                    <RangeInput vertical={ vertical }
                        id='speed-input'
                        min={ DEFAULT_RANGES.speedRange.minValue }
                        max={ DEFAULT_RANGES.speedRange.maxValue }
                        minValue={ rangeState.speedRange.minValue }
                        maxValue={ rangeState.speedRange.maxValue }
                        onChange={ handleSpeedRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="octave-input">
                        Octaves:<br />
                        { rangeState.octaveRange.minValue } - { rangeState.octaveRange.maxValue }
                    </label>
                    <RangeInput vertical={ vertical }
                        size='normal'
                        id='octave-input'
                        min={ DEFAULT_RANGES.octaveRange.minValue }
                        max={ DEFAULT_RANGES.octaveRange.maxValue }
                        minValue={ rangeState.octaveRange.minValue }
                        maxValue={ rangeState.octaveRange.maxValue }
                        onChange={ handleOctaveRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="duration-input">
                        Length:<br />
                        { ms2bpm( rangeState.durationRange.minValue ) } - { ms2bpm( rangeState.durationRange.maxValue ) } bpm
                    </label>
                    <RangeInput vertical={ vertical }
                        size='normal'
                        id='duration-input'
                        min={ DEFAULT_RANGES.durationRange.minValue }
                        max={ DEFAULT_RANGES.durationRange.maxValue }
                        minValue={ rangeState.durationRange.minValue }
                        maxValue={ rangeState.durationRange.maxValue }
                        onChange={ handleDurationRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="probability-input" title="Probability threshold range">
                        <input
                            type="checkbox"
                            checked={ rangeState.playMode === playModeTypes.PROBABILITY }
                            onChange={ handlePlayModeChange }
                        />
                        Probability:<br />
                        { percentage( rangeState.probRange.minValue ) }-{ percentage( rangeState.probRange.maxValue ) }%
                    </label>
                    { rangeState.playMode === playModeTypes.PROBABILITY && (
                        <RangeInput vertical={ vertical }
                            min={ DEFAULT_RANGES.probRange.minValue }
                            max={ DEFAULT_RANGES.probRange.maxValue }
                            minValue={ rangeState.probRange.minValue }
                            maxValue={ rangeState.probRange.maxValue }
                            onChange={ handleprobRangeChange }
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
