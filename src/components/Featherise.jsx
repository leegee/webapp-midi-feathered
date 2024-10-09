import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { probabilityTriangular, percentage } from '../lib/maths';
import { playModeTypes, sendNotes } from '../lib/midi-funcs';
import { notesOnAtom, midiOutputChannelsAtom, CCsOnAtom } from '../lib/store';
import { localStorageOr, savePeriodically } from '../lib/local-storage';
import { loadJson, saveJson } from '../lib/settings-files';
import RangeInput from './RangeInput';
import styles from './Featherise.module.css';


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

const RANGE_EXTENTS = {
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

export default function Featherise ( { selectedOutput, vertical = false, height = '100%' } ) {
    const [ midiOutputChannels, setMidiOutputChannels ] = useAtom( midiOutputChannelsAtom );
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ CCsOn ] = useAtom( CCsOnAtom );
    const [ extensions, setExtensions ] = useState( EXTENSIONS_SELECTED_DEFAULT );

    const [ playMode, setPlayMode ] = useState( localStorageOr( 'playMode', 1 ) );

    const rangeState = useMemo( () => {
        const initialState = {};
        for ( let key in RANGE_EXTENTS ) {
            const setterName = 'set' + ucfirst( key );
            initialState[ key ] = {
                minValue: localStorageOr( key + "_minValue", RANGE_EXTENTS[ key ].minValue ),
                maxValue: localStorageOr( key + "_maxValue", RANGE_EXTENTS[ key ].maxValue ),
            };
            initialState[ setterName ] = ( newValue ) => {
                const newState = { ...initialState[ key ], ...newValue };
                initialState[ key ] = newState;
            };
        }
        return initialState;
    }, [] );

    for ( let key in RANGE_EXTENTS ) {
        const setterName = 'set' + ucfirst( key );
        // eslint-disable-next-line react-hooks/rules-of-hooks
        [ rangeState[ key ], rangeState[ setterName ] ] = useState( {
            minValue: localStorageOr( key + "_minValue", RANGE_EXTENTS[ key ].minValue ),
            maxValue: localStorageOr( key + "_maxValue", RANGE_EXTENTS[ key ].maxValue ),
        } );
    }

    const handleRangeChange = ( newRange, setter ) => {
        setter( {
            minValue: Number( newRange.minValue ),
            maxValue: Number( newRange.maxValue ),
        } );
    };

    const handleExtensionsChange = ( key ) => {
        setExtensions( prevExtensions => ( {
            ...prevExtensions,
            [ key ]: !prevExtensions[ key ]
        } ) );
    };

    const handlePlayModeChange = ( event ) => setPlayMode( event.target.checked ? playModeTypes.POLY : playModeTypes.MONO );

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
        const saveValuesToLocalStorage = Object.entries( RANGE_EXTENTS ).reduce( ( acc, [ key ] ) => {
            acc[ `${ key }_minValue` ] = rangeState[ key ].minValue;
            acc[ `${ key }_maxValue` ] = rangeState[ key ].maxValue;
            return acc;
        }, {} );

        return savePeriodically( {
            playMode: playMode,
            ...saveValuesToLocalStorage,
        } );

    } );

    useEffect( () => {
        let bpsTimer;

        // Was bpsListener
        const playNoteEveryBps = () => {
            sendNotes( notesOn, rangeState, extensions, midiOutputChannels, selectedOutput );

            // Set the next recursion:
            const recallTime = 1000 / probabilityTriangular( rangeState.bpsRange.minValue, rangeState.bpsRange.maxValue );
            bpsTimer = setTimeout( playNoteEveryBps, recallTime );
        };

        // Begin the recursion:
        playNoteEveryBps();

        return () => clearTimeout( bpsTimer );
    }, [ notesOn, rangeState, selectedOutput, midiOutputChannels, CCsOn, extensions ] );

    return (
        <fieldset className={ styles[ 'featherize-component' ] } style={ { height } }>
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
                        min={ RANGE_EXTENTS.octaveRange.minValue }
                        max={ RANGE_EXTENTS.octaveRange.maxValue }
                        minValue={ rangeState.octaveRange.minValue }
                        maxValue={ rangeState.octaveRange.maxValue }
                        onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setOctaveRange ) }
                    />
                </div>

                <div className={ styles[ 'play-control' ] }>
                    <label htmlFor="bps-input">
                        <span>Notes/sec</span>
                        <span>
                            { Math.floor( rangeState.bpsRange.minValue ) }
                            <small>to</small>
                            { Math.floor( rangeState.bpsRange.maxValue ) }
                        </span>
                    </label>
                    <RangeInput vertical={ vertical }
                        id='bps-input'
                        flipDisplay={ true }
                        min={ RANGE_EXTENTS.bpsRange.minValue }
                        max={ RANGE_EXTENTS.bpsRange.maxValue }
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
                        min={ RANGE_EXTENTS.velocityRange.minValue }
                        max={ RANGE_EXTENTS.velocityRange.maxValue }
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
                        min={ RANGE_EXTENTS.speedRange.minValue }
                        max={ RANGE_EXTENTS.speedRange.maxValue }
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
                        min={ RANGE_EXTENTS.durationRange.minValue }
                        max={ RANGE_EXTENTS.durationRange.maxValue }
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
                                checked={ playMode === playModeTypes.POLY }
                                onChange={ handlePlayModeChange }
                            />
                            { playMode !== playModeTypes.POLY && ( <>Polyphonic</> ) }
                            { playMode === playModeTypes.POLY && ( <>Polyphony:</> ) }
                        </span>
                        { playMode === playModeTypes.POLY && (
                            <span>
                                { percentage( rangeState.polyProbRange.minValue ) }
                                <small>to</small>
                                { percentage( rangeState.polyProbRange.maxValue ) }%
                            </span>
                        ) }
                    </label>
                    { playMode === playModeTypes.POLY && (
                        <RangeInput vertical={ vertical }
                            size='normal'
                            min={ RANGE_EXTENTS.polyProbRange.minValue }
                            max={ RANGE_EXTENTS.polyProbRange.maxValue }
                            minValue={ rangeState.polyProbRange.minValue }
                            maxValue={ rangeState.polyProbRange.maxValue }
                            onChange={ ( newRange ) => handleRangeChange( newRange, rangeState.setPolyProbRange ) }
                        />
                    ) }
                </div>

                <div className={ `${ styles[ 'play-control' ] } ${ styles.extensions }` } >
                    <label htmlFor="extensions-input">
                        <span>Extensions:</span>
                        <span>
                            { percentage( rangeState.extensionsProbRange.minValue ) }
                            <small>to</small>
                            { percentage( rangeState.extensionsProbRange.maxValue ) } %
                        </span>
                    </label>

                    <div className={ styles.sideBySide }>
                        <RangeInput vertical={ vertical }
                            size='narrow'
                            id='extensions-input'
                            flipDisplay={ true }
                            forceIntegers={ true }
                            min={ RANGE_EXTENTS.extensionsProbRange.minValue }
                            max={ RANGE_EXTENTS.extensionsProbRange.maxValue }
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
    height: PropTypes.string,
};
