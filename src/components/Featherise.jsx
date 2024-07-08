import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { sendNoteWithDuration } from '../lib/midi-messages';
import { notesOnAtom, midiOutputChannelsAtom, CCsOnAtom } from '../lib/store';
import { localStorageOr, savePeriodically } from '../lib/local-storage';
import RangeInput from './RangeInput';
import { loadJson, saveJson } from '../lib/settings-files';
import styles from './Featherise.module.css';

const playModeTypes = {
    MONO: 0,
    POLY: 1,
};

const DEFAULT_RANGES = {
    polyProbRange: {
        minValue: 0,
        maxValue: 1,
    },
    durationRange: {
        minValue: 10,
        maxValue: 6000,
    },
    velocityRange: {
        minValue: -100,
        maxValue: 100,
    },
    bpsRange: {
        minValue: 1,
        maxValue: 20,
    },
    speedRange: {
        minValue: 200,
        maxValue: 6000,
    },
    octaveRange: {
        minValue: -3,
        maxValue: 3
    },
};

// const CCs = { velocity: 11 };

const ucfirst = str => str.charAt( 0 ).toUpperCase() + str.slice( 1 );

function probabilityTriangular ( min, max, mode ) {
    mode = mode || ( min + ( max - min ) / 2 );
    const u = Math.random();

    if ( u < ( mode - min ) / ( max - min ) ) {
        return min + Math.sqrt( u * ( max - min ) * ( mode - min ) );
    } else {
        return max - Math.sqrt( ( 1 - u ) * ( max - min ) * ( max - mode ) );
    }
}

export default function Featherise ( { selectedOutput, vertical = false } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ CCsOn ] = useAtom( CCsOnAtom );
    const [ midiOutputChannels, setMidiOutputChannels ] = useAtom( midiOutputChannelsAtom );

    const rangeState = {};
    [ rangeState.playMode, rangeState.setPlayMode ] = useState( localStorageOr( 'playMode', 1 ) );

    for ( let key in DEFAULT_RANGES ) {
        const setterName = 'set' + ucfirst( key );
        // eslint-disable-next-line react-hooks/rules-of-hooks
        [ rangeState[ key ], rangeState[ setterName ] ] = useState( {
            minValue: localStorageOr( key + "_minValue", DEFAULT_RANGES[ key ].minValue ),
            maxValue: localStorageOr( key + "_maxValue", DEFAULT_RANGES[ key ].maxValue ),
        } );
    }

    const handleBpsRangeChange = ( newRange ) => {
        rangeState.setBpsRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : rangeState.bpsRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : rangeState.bpsRange.maxValue ) ),
        } );
        // console.debug( `Selected BPS Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleVelocityRangeChange = ( newRange ) => {
        rangeState.setVelocityRange( {
            minValue: Math.floor( Number( newRange.minValue !== undefined ? newRange.minValue : rangeState.velocityRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue !== undefined ? newRange.maxValue : rangeState.velocityRange.maxValue ) ),
        } );
        // console.debug( `Selected velocity range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleSpeedRangeChange = ( newRange ) => {
        rangeState.setSpeedRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        // console.debug( `Selected Speed Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleOctaveRangeChange = ( newRange ) => {
        rangeState.setOctaveRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        // console.debug( `Selected Octave Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handleDurationRangeChange = ( newRange ) => {
        rangeState.setDurationRange( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
        // console.debug( `Selected Duration Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handlepolyProbRangeChange = ( newRange ) => {
        rangeState.setpolyProbRange( {
            minValue: Number( newRange.minValue ),
            maxValue: Number( newRange.maxValue ),
        } );
        // console.debug( `Selected Probability Threshold Range: Min = ${ newRange.minValue }, Max = ${ newRange.maxValue }` );
    };

    const handlePlayModeChange = ( event ) => {
        rangeState.setPlayMode(
            event.target.checked ? playModeTypes.POLY : playModeTypes.MONO
        );
    };

    const percentage = ( real ) => Math.floor( real * 100 );

    // const ms2bpm = ( n ) => 60000 / Number( n );
    // const ms2bps = ( n ) => 600 / Number( n );

    const save = () => {
        saveJson( {
            midiOutputChannels,
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
            polyProbRange: {
                minValue: rangeState.polyProbRange.minValue,
                maxValue: rangeState.polyProbRange.maxValue,
            },
        } );
    }

    const load = async () => {
        try {
            const settings = await loadJson();
            console.log( 'Loaeded', settings );
            setMidiOutputChannels( settings.midiOutputChannels );
            rangeState.setBpsRange( settings.bpsRange );
            rangeState.setVelocityRange( settings.velocityRange );
            rangeState.setSpeedRange( settings.speedRange );
            rangeState.setDurationRange( settings.durationRange );
            rangeState.setpolyProbRange( settings.polyProbRange );
        } catch ( e ) {
            console.error( e );
            alert( e );
        }
    }

    // @see localStorageOr
    useEffect( () => {
        const saveValuesToLocalStorage = Object.entries( DEFAULT_RANGES ).reduce( ( acc, [ key ] ) => {
            acc[ `${ key }_minValue` ] = rangeState[ key ].minValue;
            acc[ `${ key }_maxValue` ] = rangeState[ key ].maxValue;
            return acc;
        }, {} );

        return savePeriodically( {
            playMode: rangeState.playMode,
            ...saveValuesToLocalStorage,
        } );

    } );

    useEffect( () => {
        let bpsTimer;

        // Either a CC value or based on teh note velocity adjusted by  the range
        const generateVelocity = ( playedNoteVvelocity ) => {
            // if ( CCsOn[ CCs.velocity ] ) {
            //     console.log( CCsOnAtom[ CCs.velocity ] );
            //     return CCsOnAtom[ CCs.velocity ];
            // }

            // Returns an velocity adjusted by percentage, clamped to valid MIDI values
            const { maxValue, minValue } = rangeState.velocityRange;

            const minPercentageFactor = 1 + ( minValue / 100 );
            const maxPercentageFactor = 1 + ( maxValue / 100 );

            // Generate a random factor between minPercentageFactor and maxPercentageFactor
            const randomFactor = probabilityTriangular( minPercentageFactor, maxPercentageFactor );

            const adjustedVelocity = playedNoteVvelocity * randomFactor;

            // Ensure the adjusted velocity is within valid MIDI velocity range
            return Math.min( Math.max( adjustedVelocity, 0 ), 127 );
        }

        // Was bpsListener
        const playNoteEveryBps = () => {
            const pitches = Object.keys( notesOn );
            if ( !pitches.length ) {
                return;
            }

            const usePitches = rangeState.playMode === playModeTypes.MONO
                ? [ Number( pitches[ Math.floor( Math.random() * pitches.length ) ] ) ]
                : Object.keys( notesOn ).filter( () => {
                    const probability = probabilityTriangular( 0, 1 );
                    return probability < rangeState.polyProbRange.maxValue && probability > rangeState.polyProbRange.minValue;
                } ).map( usePitch => Number( usePitch ) );

            usePitches.forEach( ( aPitch ) => {
                const useDurationMs = rangeState.speedRange.minValue + Math.random() * ( rangeState.speedRange.maxValue - rangeState.speedRange.minValue );
                const useVelocity = generateVelocity( notesOn[ [ aPitch ] ] );

                const useOctave = ( Math.floor(
                    rangeState.octaveRange.minValue == rangeState.octaveRange.maxValue
                        ? rangeState.octaveRange.minValue
                        : probabilityTriangular( rangeState.octaveRange.minValue, rangeState.octaveRange.maxValue )
                ) - 1 ) * 12;

                const midiOutputChannel = midiOutputChannels.length == 1
                    ? midiOutputChannels[ 0 ]                                                        // Use the only output selected
                    : midiOutputChannels[ Math.floor( Math.random() * midiOutputChannels.length ) ]; // Use a random output channel

                let usePitch = aPitch + useOctave;

                // Reverse the octave if it puts the note out of range
                if ( usePitch >= 127 || usePitch < 28 ) {
                    usePitch -= useOctave;
                }

                try {
                    sendNoteWithDuration( usePitch, useVelocity, useDurationMs, selectedOutput, midiOutputChannel );
                }
                catch ( e ) {
                    console.error( `usePitch was ${ usePitch }` );
                    throw e;
                }
            } );

            // Set the next recursion:
            const recallTime = 1000 / probabilityTriangular( rangeState.bpsRange.minValue, rangeState.bpsRange.maxValue );
            bpsTimer = setTimeout( playNoteEveryBps, recallTime );
        };

        // Begin the recursion:
        playNoteEveryBps();

        return () => clearTimeout( bpsTimer );
    }, [ notesOn, rangeState.playMode, rangeState.polyProbRange, rangeState.speedRange, selectedOutput, rangeState.bpsRange.minValue, rangeState.bpsRange.maxValue, midiOutputChannels, rangeState.octaveRange.minValue, rangeState.octaveRange.maxValue, rangeState.velocityRange, CCsOn ] );

    return (
        <fieldset className={ styles[ 'featherize-component' ] }>
            <legend className={ styles.legend }>
                Feathered Chords
                <span className={ styles.settings }>
                    <button onClick={ load }>Load</button>
                    <button onClick={ save }>Save</button>
                </span>
            </legend>

            <div className={ styles[ 'play-controls' ] + ' ' + ( vertical ? styles.vertical : styles.horiztonal ) }>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="octave-input">
                        <span>Octaves:</span>
                        <span>
                            { rangeState.octaveRange.minValue } <small>to</small> { rangeState.octaveRange.maxValue }
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        size='normal'
                        id='octave-input'
                        flipDisplay={ true }
                        forceIntegers={ true }
                        min={ DEFAULT_RANGES.octaveRange.minValue }
                        max={ DEFAULT_RANGES.octaveRange.maxValue }
                        minValue={ rangeState.octaveRange.minValue }
                        maxValue={ rangeState.octaveRange.maxValue }
                        onChange={ handleOctaveRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="bps-input">
                        <span>
                            { rangeState.bpsRange.minValue }
                            <small>to</small>
                            { rangeState.bpsRange.maxValue }
                        </span>
                        <span>
                            notes/sec
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        id='bps-input'
                        flipDisplay={ true }
                        min={ DEFAULT_RANGES.bpsRange.minValue }
                        max={ DEFAULT_RANGES.bpsRange.maxValue }
                        minValue={ rangeState.bpsRange.minValue }
                        maxValue={ rangeState.bpsRange.maxValue }
                        onChange={ handleBpsRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="velocity-input">
                        <span style={ { display: 'inline-flex', width: '100%' } }>
                            Velocity:
                        </span>
                        <span>
                            { rangeState.velocityRange.minValue }
                            <small>to</small>
                            { rangeState.velocityRange.maxValue } %
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        id='velocity-input'
                        flipDisplay={ false }
                        forceIntegers={ true }
                        min={ DEFAULT_RANGES.velocityRange.minValue }
                        max={ DEFAULT_RANGES.velocityRange.maxValue }
                        minValue={ rangeState.velocityRange.minValue }
                        maxValue={ rangeState.velocityRange.maxValue }
                        onChange={ handleVelocityRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="speed-input">
                        <span> Speed: </span>
                        <span>
                            { Math.floor( ( rangeState.speedRange.minValue ) ) }
                            <small>to</small>
                            { Math.floor( ( rangeState.speedRange.maxValue ) ) } ms
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        id='speed-input'
                        flipDisplay={ true }
                        min={ DEFAULT_RANGES.speedRange.minValue }
                        max={ DEFAULT_RANGES.speedRange.maxValue }
                        minValue={ rangeState.speedRange.minValue }
                        maxValue={ rangeState.speedRange.maxValue }
                        onChange={ handleSpeedRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="duration-input">
                        <span>Length:</span>
                        <span>
                            { Math.floor( rangeState.durationRange.minValue ) }
                            <small>to</small>
                            { Math.floor( rangeState.durationRange.maxValue ) } ms
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        size='normal'
                        id='duration-input'
                        flipDisplay={ true }
                        forceIntegers={ true }
                        min={ DEFAULT_RANGES.durationRange.minValue }
                        max={ DEFAULT_RANGES.durationRange.maxValue }
                        minValue={ rangeState.durationRange.minValue }
                        maxValue={ rangeState.durationRange.maxValue }
                        onChange={ handleDurationRangeChange }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="probability-input" title="Probability of a note from a chord being triggered">
                        <span>
                            <input
                                type="checkbox"
                                checked={ rangeState.playMode === playModeTypes.POLY }
                                onChange={ handlePlayModeChange }
                            />
                            { rangeState.playMode !== playModeTypes.POLY && ( <>Polyphonic</> ) }
                            { rangeState.playMode === playModeTypes.POLY && ( <>Polyphony:</> ) }
                        </span>
                        { rangeState.playMode === playModeTypes.POLY && (
                            <span>{ percentage( rangeState.polyProbRange.minValue ) } <small>to</small>{ percentage( rangeState.polyProbRange.maxValue ) }%</span>
                        ) }
                    </label>
                    { rangeState.playMode === playModeTypes.POLY && (
                        <RangeInput vertical={ vertical }
                            size='narrow'
                            min={ DEFAULT_RANGES.polyProbRange.minValue }
                            max={ DEFAULT_RANGES.polyProbRange.maxValue }
                            minValue={ rangeState.polyProbRange.minValue }
                            maxValue={ rangeState.polyProbRange.maxValue }
                            onChange={ handlepolyProbRangeChange }
                        />
                    ) }
                </div>
            </div>

        </fieldset >
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
    vertical: PropTypes.bool,
};
