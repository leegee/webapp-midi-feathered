/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import styles from './NoteModifier.module.css';

import { notesOnAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

const INITIAL_BPS = 6;
const durationMs = 1000;

ChordNoteRandomiserComponent.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};

export default function ChordNoteRandomiserComponent({ selectedOutput }) {
    const [notesOn] = useAtom(notesOnAtom);
    const [bps, setBps] = useState(INITIAL_BPS);
    const [alwaysPlayOneNote, setAlwaysPlayOneNote] = useState(true); // State for checkbox
    const [probabilityThreshold, setProbabilityThreshold] = useState(0.5); // State for probability slider

    const handleChangeBps = (event) => {
        setBps(Number(event.target.value));
    };

    const handleCheckboxChange = (event) => {
        setAlwaysPlayOneNote(event.target.checked);
    };

    const handleProbabilityChange = (event) => {
        setProbabilityThreshold(Number(event.target.value));
    };

    function bpsListener() {
        const pitches = Object.keys(notesOn);
        if (!pitches.length) {
            return;
        }

        if (alwaysPlayOneNote) {
            // Always play one random note
            const pitch = pitches[Math.floor(Math.random() * pitches.length)];
            sendNoteWithDuration(
                pitch,
                notesOn[pitch].velocity,
                durationMs,
                selectedOutput
            );
        } else {
            // Iterate through all notes based on the probability threshold
            Object.keys(notesOn).forEach((pitch) => {
                const probability = Math.random(); // Random number between 0 and 1
                if (probability < probabilityThreshold) {
                    sendNoteWithDuration(
                        pitch,
                        notesOn[pitch].velocity,
                        durationMs,
                        selectedOutput
                    );
                }
            });
        }
    }

    useEffect(() => {
        const bpsInterval = 1000 / bps;
        const bpsTimer = setInterval(bpsListener, bpsInterval);
        return () => clearInterval(bpsTimer);
    }, [bps, notesOn, alwaysPlayOneNote, probabilityThreshold]);

    return (
        <section className="padded">
            <h2>Chord-note Randomiser</h2>

            <label>
                Notes per second
                <input
                    className={styles.bpsInput}
                    type="range"
                    value={bps}
                    onChange={handleChangeBps}
                    min="1"
                    max="10"
                />
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={alwaysPlayOneNote}
                    onChange={ handleCheckboxChange }
                    disabled={!alwaysPlayOneNote}
                />
                Always play one note
            </label>

            <label>
                Probability threshold
                <input
                    className={styles.probabilityInput}
                    type="range"
                    value={probabilityThreshold}
                    onChange={handleProbabilityChange}
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={alwaysPlayOneNote}
                />
                {probabilityThreshold.toFixed(2)} {/* Display the current value */}
            </label>
        </section>
    );
}
