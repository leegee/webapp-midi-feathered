import { useEffect, useMemo, useReducer, useState } from 'react';
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
        maxValue: 1000,
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

const ucfirst = str => str.charAt(0).toUpperCase() + str.slice(1);

function reducer(state, action) {
    switch (action.type) {
        case "SET_RANGE":
            return { ...state, [action.key]: action.payload };
        default:
            return state;
    }
}

export default function Featherise({ selectedOutput, vertical = false, height = '100%' }) {
    const [midiOutputChannels, setMidiOutputChannels] = useAtom(midiOutputChannelsAtom);
    const [notesOn] = useAtom(notesOnAtom);
    const [CCsOn] = useAtom(CCsOnAtom);
    const [extensions, setExtensions] = useState(EXTENSIONS_SELECTED_DEFAULT);

    const [playMode, setPlayMode] = useState(localStorageOr('playMode', 1));

    const initialState = useMemo(() => {
        const obj = {};
        for (const key in RANGE_EXTENTS) {
            obj[key] = {
                minValue: localStorageOr(key + "_minValue", RANGE_EXTENTS[key].minValue),
                maxValue: localStorageOr(key + "_maxValue", RANGE_EXTENTS[key].maxValue),
            };
        }
        return obj;
    }, []);

    const [state, dispatch] = useReducer(reducer, initialState);

    function setRange(key, newValue) {
        dispatch({ type: "SET_RANGE", key, payload: newValue });
        localStorage.setItem(key + "_minValue", JSON.stringify(newValue.minValue));
        localStorage.setItem(key + "_maxValue", JSON.stringify(newValue.maxValue));
    }

    const rangeState = useMemo(() => {
        const obj = {};
        for (const key in RANGE_EXTENTS) {
            obj[key] = state[key];
            obj["set" + ucfirst(key)] = (newValue) => setRange(key, newValue);
        }
        return obj;
    }, [state]);

    const handleRangeChange = (newRange, setter) => {
        setter({
            minValue: Number(newRange.minValue),
            maxValue: Number(newRange.maxValue),
        });
    };

    const handleExtensionsChange = (key) => {
        setExtensions(prevExtensions => ({
            ...prevExtensions,
            [key]: !prevExtensions[key]
        }));
    };

    const handlePlayModeChange = (event) => setPlayMode(event.target.checked ? playModeTypes.POLY : playModeTypes.MONO);

    const save = () => {
        saveJson({
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
                maxValue: rangeState.extensionsProbRange.maxValue,
            }
        });
    }

    const load = async () => {
        try {
            const settings = await loadJson();
            console.log('Loaeded', settings);
            setMidiOutputChannels(settings.midiOutputChannels);
            rangeState.setBpsRange(settings.bpsRange);
            rangeState.setVelocityRange(settings.velocityRange);
            rangeState.setSpeedRange(settings.speedRange);
            rangeState.setDurationRange(settings.durationRange);
            rangeState.setPolyProbRange(settings.polyProbRange);
            rangeState.setExtensionsProbRange(settings.extensionsProbRange);
        } catch (e) {
            console.error(e);
            alert(e);
        }
    }

    // @see localStorageOr
    useEffect(() => {
        const saveValuesToLocalStorage = Object.entries(RANGE_EXTENTS).reduce((acc, [key]) => {
            acc[`${key}_minValue`] = rangeState[key].minValue;
            acc[`${key}_maxValue`] = rangeState[key].maxValue;
            return acc;
        }, {});

        return savePeriodically({
            playMode: playMode,
            ...saveValuesToLocalStorage,
        }, [playMode, rangeState]);

    });

    useEffect(() => {
        let bpsTimer;

        // Was bpsListener
        const playNoteEveryBps = () => {
            sendNotes(notesOn, rangeState, extensions, midiOutputChannels, selectedOutput);

            // Set the next recursion:
            const recallTime = 1000 / probabilityTriangular(rangeState.bpsRange.minValue, rangeState.bpsRange.maxValue);
            bpsTimer = setTimeout(playNoteEveryBps, recallTime);
        };

        // Begin the recursion:
        playNoteEveryBps();

        return () => clearTimeout(bpsTimer);
    }, [notesOn, rangeState, selectedOutput, midiOutputChannels, CCsOn, extensions]);


    const RANGE_CONTROLS = [
        { key: 'octaveRange', label: 'Octaves', size: 'normal', flipDisplay: true, forceIntegers: true },
        { key: 'bpsRange', label: 'Notes/sec', flipDisplay: true, formatValue: Math.floor },
        { key: 'velocityRange', label: 'Velocity', forceIntegers: true, unit: '%', flipDisplay: false },
        { key: 'speedRange', label: 'Speed', flipDisplay: true, unit: 'ms', formatValue: Math.floor },
        { key: 'durationRange', label: 'Length', forceIntegers: true, flipDisplay: true, unit: 'ms', formatValue: Math.floor },
        { key: 'polyProbRange', label: 'Polyphony Probability', size: 'normal', flipDisplay: true, formatValue: (v) => `${percentage(v)}%` },
        // { key: 'extensionsProbRange', label: 'Extensions Probability', size: 'narrow', flipDisplay: true, forceIntegers: true, formatValue: (v) => `${percentage(v)}%` },
    ];

    return (
        <fieldset className={styles['featherize-component']} style={{ height }}>
            <legend className={styles.legend}>
                Feathered Chords
                <span className={styles.settings}>
                    <button onClick={load}>Load</button>
                    <button onClick={save}>Save</button>
                </span>
            </legend>

            <div className={styles['play-controls'] + ' ' + (vertical ? styles.vertical : styles.horiztonal)}>

                {RANGE_CONTROLS.map(({ key, label, ...props }) => {
                    // For polyProbRange and extensionsProbRange, render conditionally or with extra UI
                    if (key === 'polyProbRange' && playMode !== playModeTypes.POLY) return null;

                    return (
                        <RangeControl
                            key={key}
                            id={`${key}-input`}
                            label={key === 'polyProbRange' ? 'Polyphony:' : label}
                            vertical={vertical}
                            size={props.size}
                            min={RANGE_EXTENTS[key].minValue}
                            max={RANGE_EXTENTS[key].maxValue}
                            range={rangeState[key]}
                            setRange={rangeState[`set${ucfirst(key)}`]}
                            flipDisplay={props.flipDisplay}
                            forceIntegers={props.forceIntegers}
                            unit={props.unit}
                            formatValue={props.formatValue || ((v) => v)}
                        >
                            {key === 'polyProbRange' && (
                                <RangeInput
                                    vertical={vertical}
                                    size='normal'
                                    min={RANGE_EXTENTS.polyProbRange.minValue}
                                    max={RANGE_EXTENTS.polyProbRange.maxValue}
                                    minValue={rangeState.polyProbRange.minValue}
                                    maxValue={rangeState.polyProbRange.maxValue}
                                    onChange={(newRange) => handleRangeChange(newRange, rangeState.setPolyProbRange)}
                                />
                            )}
                        </RangeControl>
                    );
                })}

                <ExtensionsControl extensions={extensions} onChange={handleExtensionsChange} rangeState={rangeState} vertical={vertical} />

            </div>

        </fieldset >
    );
}

Featherise.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
    vertical: PropTypes.bool,
    height: PropTypes.string,
};

function RangeControl({
    id,
    label,
    vertical,
    size = 'normal',
    min,
    max,
    range,
    setRange,
    flipDisplay = false,
    forceIntegers = false,
    unit = '',
    formatValue = (v) => v,
    children,
}) {
    return (
        <div className={styles['play-control']}>
            <label htmlFor={id}>
                <span>{label}</span>
                <span>
                    {formatValue(range.minValue)} {unit && <small>{unit}</small>} to {formatValue(range.maxValue)} {unit}
                </span>
            </label>
            <RangeInput
                vertical={vertical}
                size={size}
                id={id}
                flipDisplay={flipDisplay}
                forceIntegers={forceIntegers}
                min={min}
                max={max}
                minValue={range.minValue}
                maxValue={range.maxValue}
                onChange={(newRange) => setRange({
                    minValue: Number(newRange.minValue),
                    maxValue: Number(newRange.maxValue),
                })}
            />
            {children}
        </div>
    );
}

function ExtensionsControl({ extensions, onChange, rangeState, vertical }) {
    return (
        <div className={`${styles['play-control']} ${styles.extensions}`}>
            <label htmlFor="extensions-input">
                <span>Extensions:</span>
                <span>
                    {percentage(rangeState.extensionsProbRange.minValue)}
                    <small>to</small>
                    {percentage(rangeState.extensionsProbRange.maxValue)} %
                </span>
            </label>
            <div className={styles.sideBySide}>
                <RangeInput
                    vertical={vertical}
                    size='narrow'
                    id='extensions-input'
                    flipDisplay={true}
                    forceIntegers={true}
                    min={RANGE_EXTENTS.extensionsProbRange.minValue}
                    max={RANGE_EXTENTS.extensionsProbRange.maxValue}
                    minValue={rangeState.extensionsProbRange.minValue}
                    maxValue={rangeState.extensionsProbRange.maxValue}
                    onChange={(newRange) => handleRangeChange(newRange, rangeState.setExtensionsProbRange)}
                />
                <div className={styles.labels}>
                    {Object.entries(EXTENSIONS_DISPLAY).map(([key, label]) => (
                        <label key={key}>
                            <input
                                type='checkbox'
                                value={key}
                                onChange={() => onChange(key)}
                                checked={extensions[key]}
                            /> {label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
