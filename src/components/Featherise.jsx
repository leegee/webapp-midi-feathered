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

const EXTENSIONS_SELECTED_DEFAULT = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
}

const EXTENSIONS_DISPLAY = {
    1: '♭II',
    2: 'II',
    3: '♭III',
    4: 'III',
    5: 'IV',
    6: '♭V',
    7: 'V',
    8: '♭VI',
    9: 'VI',
    10: '♭VII',
    11: 'VII',
};

const RANGES_EXTENTS = {
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
    extensionsProbRange: {
        minValue: 0,
        maxValue: 1,
    }
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
    const [ midiOutputChannels, setMidiOutputChannels ] = useAtom( midiOutputChannelsAtom );
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ CCsOn ] = useAtom( CCsOnAtom );
    const [ extensions, setExtensions ] = useState( EXTENSIONS_SELECTED_DEFAULT );

    const rangeState = {};
    [ rangeState.playMode, rangeState.setPlayMode ] = useState( localStorageOr( 'playMode', 1 ) );

    for ( let key in RANGES_EXTENTS ) {
        const setterName = 'set' + ucfirst( key );
        // eslint-disable-next-line react-hooks/rules-of-hooks
        [ rangeState[ key ], rangeState[ setterName ] ] = useState( {
            minValue: localStorageOr( key + "_minValue", RANGES_EXTENTS[ key ].minValue ),
            maxValue: localStorageOr( key + "_maxValue", RANGES_EXTENTS[ key ].maxValue ),
        } );
    }

    const handleRangeChange = ( newRange, setter ) => {
        setter( {
            minValue: Math.floor( Number( newRange.minValue ) ),
            maxValue: Math.floor( Number( newRange.maxValue ) ),
        } );
    };

    const handleExtensionsChange = ( key ) => {
        setExtensions( prevExtensions => ( {
            ...prevExtensions,
            [ key ]: !prevExtensions[ key ]
        } ) );
    };

    const handlePlayModeChange = ( event ) => rangeState.setPlayMode( event.target.checked ? playModeTypes.POLY : playModeTypes.MONO );

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
            extensionsProbRange: {
                minValue: rangeState.extensionsProbRange.minValue,
                miaxValue: rangeState.extensionsProbRange.maxValue,
            }
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
            rangeState.setPolyProbRange( settings.polyProbRange );
            rangeState.setExtensionsProbRange( settings.extensionsProbRange );
        } catch ( e ) {
            console.error( e );
            alert( e );
        }
    }

    // @see localStorageOr
    useEffect( () => {
        const saveValuesToLocalStorage = Object.entries( RANGES_EXTENTS ).reduce( ( acc, [ key ] ) => {
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
            const adjustedVelocity = playedNoteVvelocity * probabilityTriangular( minPercentageFactor, maxPercentageFactor );
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

                const shallUseExtensions = Math.random() > probabilityTriangular( rangeState.extensionsProbRange.minValue, rangeState.extensionsProbRange.maxValue );
                let useExtenion = 0;
                if ( shallUseExtensions ) {
                    const activeExtensions = Object.keys( extensions ).filter( ext => extensions[ ext ] );
                    useExtenion = Number( activeExtensions[ Math.floor( Math.random() * activeExtensions.length ) ] );
                }

                let usePitch = aPitch + useOctave + useExtenion;

                // Reverse the octave if it puts the note out of range
                if ( usePitch >= 127 || usePitch < 28 ) {
                    usePitch -= useOctave;
                    if ( usePitch >= 127 || usePitch < 28 ) {
                        usePitch -= useExtenion;
                    }
                }


                const midiOutputChannel = midiOutputChannels.length == 1
                    ? midiOutputChannels[ 0 ]                                                        // Use the only output selected
                    : midiOutputChannels[ Math.floor( Math.random() * midiOutputChannels.length ) ]; // Use a random output channel


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
    }, [ notesOn, rangeState.playMode, rangeState.polyProbRange, rangeState.speedRange, selectedOutput, rangeState.bpsRange.minValue, rangeState.bpsRange.maxValue, midiOutputChannels, rangeState.octaveRange.minValue, rangeState.octaveRange.maxValue, rangeState.velocityRange, CCsOn, rangeState.extensionsProbRange.minValue, rangeState.extensionsProbRange.maxValue, extensions ] );

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
                        min={ RANGES_EXTENTS.octaveRange.minValue }
                        max={ RANGES_EXTENTS.octaveRange.maxValue }
                        minValue={ rangeState.octaveRange.minValue }
                        maxValue={ rangeState.octaveRange.maxValue }
                        onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setOctaveRange ) }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="bps-input">
                        <span>Notes/sec</span>
                        <span>
                            { rangeState.bpsRange.minValue }
                            <small>to</small>
                            { rangeState.bpsRange.maxValue }
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        id='bps-input'
                        flipDisplay={ true }
                        min={ RANGES_EXTENTS.bpsRange.minValue }
                        max={ RANGES_EXTENTS.bpsRange.maxValue }
                        minValue={ rangeState.bpsRange.minValue }
                        maxValue={ rangeState.bpsRange.maxValue }
                        onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setBpsRange ) }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="velocity-input">
                        <span>Velocity:</span>
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
                        min={ RANGES_EXTENTS.velocityRange.minValue }
                        max={ RANGES_EXTENTS.velocityRange.maxValue }
                        minValue={ rangeState.velocityRange.minValue }
                        maxValue={ rangeState.velocityRange.maxValue }
                        onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setVelocityRange ) }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="speed-input">
                        <span>Speed:</span>
                        <span>
                            { Math.floor( ( rangeState.speedRange.minValue ) ) }
                            <small>to</small>
                            { Math.floor( ( rangeState.speedRange.maxValue ) ) } ms
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        id='speed-input'
                        flipDisplay={ true }
                        min={ RANGES_EXTENTS.speedRange.minValue }
                        max={ RANGES_EXTENTS.speedRange.maxValue }
                        minValue={ rangeState.speedRange.minValue }
                        maxValue={ rangeState.speedRange.maxValue }
                        onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setSpeedRange ) }
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
                        min={ RANGES_EXTENTS.durationRange.minValue }
                        max={ RANGES_EXTENTS.durationRange.maxValue }
                        minValue={ rangeState.durationRange.minValue }
                        maxValue={ rangeState.durationRange.maxValue }
                        onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setDurationRange ) }
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
                            <span>
                                { percentage( rangeState.polyProbRange.minValue ) }
                                <small>to</small>
                                { percentage( rangeState.polyProbRange.maxValue ) }%
                            </span>
                        ) }
                    </label>
                    { rangeState.playMode === playModeTypes.POLY && (
                        <RangeInput vertical={ vertical }
                            size='normal'
                            min={ RANGES_EXTENTS.polyProbRange.minValue }
                            max={ RANGES_EXTENTS.polyProbRange.maxValue }
                            minValue={ rangeState.polyProbRange.minValue }
                            maxValue={ rangeState.polyProbRange.maxValue }
                            onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setPolyProbRange ) }
                        />
                    ) }
                </div>

                <div className={ `${ styles[ 'play-control' ] } ${ styles.extensions }` } >
                    <label htmlFor="Extensions-input">
                        <span>Extensions:</span>
                        <span>
                            { percentage( rangeState.extensionsProbRange.minValue ) }
                            <small>to</small>
                            { percentage( rangeState.extensionsProbRange.maxValue ) } %
                        </span>
                    </label>

                    <div className={ styles.extcolumns }>
                        <RangeInput vertical={ vertical }
                            size='narrow'
                            id='extensions-input'
                            flipDisplay={ true }
                            forceIntegers={ true }
                            min={ RANGES_EXTENTS.extensionsProbRange.minValue }
                            max={ RANGES_EXTENTS.extensionsProbRange.maxValue }
                            minValue={ rangeState.extensionsProbRange.minValue }
                            maxValue={ rangeState.extensionsProbRange.maxValue }
                            onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setExtensionsProbRange ) }
                        />

                        <div className={ styles.labels }>
                            { Object.keys( EXTENSIONS_DISPLAY ).map( key => (
                                <label key={ key }>
                                    <input
                                        type='checkbox'
                                        value={ key }
                                        onChange={ () => handleExtensionsChange( key ) }
                                        checked={ extensions[ key ] }
                                    /> { EXTENSIONS_DISPLAY[ key ] }
                                </label>
                            ) ) }
                        </div>
                    </div>
                </div>
            </div>

        </fieldset >
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
    vertical: PropTypes.bool,
};
