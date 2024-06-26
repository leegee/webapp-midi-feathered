/* eslint-disable react-hooks/exhaustive-deps */
import  { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import styles from './NoteModifier.module.css';

import { notesOnAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

const INITAL_BPS = 6;
let durationMs = 1000;

ChordNoteRandomiserComponent.propTypes = {
    selectedOutput: PropTypes.object.isRequired 
};

export default function ChordNoteRandomiserComponent({ selectedOutput }) {
    const [notesOn] = useAtom(notesOnAtom);
    const [bps, setBps] = useState(INITAL_BPS);

    const handleChangeBps = (event) => {
        setBps(Number(event.target.value));
    };

    function bpsListener() {
        const pitches = Object.keys(notesOn);
        if (!pitches.length) {
            return;
        }

        const pitch = pitches[Math.floor(Math.random() * pitches.length)];

        sendNoteWithDuration(
            pitch,
            notesOn[pitch].velocity,
            durationMs,
            selectedOutput
        );
    }

    useEffect(() => {
        const bpsInterval = 1000 / bps; 
        const bpsTimer = setInterval(bpsListener, bpsInterval);
        return () => clearInterval(bpsTimer);
    }, [bps, notesOn]);

    return (
        <section className="padded">
            <h2> Chord-note Randomiser </h2>

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
        </section>
    );
}
