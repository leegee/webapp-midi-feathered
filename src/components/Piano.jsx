import { useAtom } from 'jotai';
import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { notesOnAtom, CCsOnAtom } from '../lib/store';
import { NOTE_ON, NOTE_OFF, ON_SCREEN_KEYBOARD, onMidiMessage } from '../lib/midi-messages';
import styles from './Piano.module.css';

const BLACK_KEYS = [1, 3, 6, 8, 10];

const PianoKey = ({ pitch, isHighlighted }) => {
    const isBlackKey = BLACK_KEYS.includes(pitch % 12);

    return (
        <span
            data-pitch={`${pitch}`}
            className={`${styles['piano-key']} ${isHighlighted ? styles['piano-key-highlighted'] : ''} ${isBlackKey ? styles['piano-key-black'] : 'piano-key-white'}`}
        />
    );
};

PianoKey.propTypes = {
    pitch: PropTypes.number.isRequired,
    isHighlighted: PropTypes.bool.isRequired,
};

export default function PianoKeyboard({ midiInputChannel }) {
    const [notesOn, setNotesOn] = useAtom(notesOnAtom);
    const [, setCCsOn] = useAtom(CCsOnAtom);

    const [keyBounds, setKeyBounds] = useState([]);
    const containerRef = useRef(null);

    const midiPitches = Array.from({ length: 88 }, (_, index) => index + 21);

    const calculateKeyBounds = useCallback(() => {
        if (!containerRef.current) return;
        const keys = containerRef.current.querySelectorAll('[data-pitch]');
        const bounds = Array.from(keys).map((el) => {
            const rect = el.getBoundingClientRect();
            return {
                pitch: Number(el.dataset.pitch),
                rect
            };
        });
        setKeyBounds(bounds);
    }, []);

    useEffect(() => {
        calculateKeyBounds();
        window.addEventListener('resize', calculateKeyBounds);
        return () => {
            window.removeEventListener('resize', calculateKeyBounds);
        };
    }, [calculateKeyBounds]);

    const keyHandler = (event, command) => {
        if (!keyBounds.length) return;

        const { clientX, clientY } = event;

        // Find the key that contains this point
        const key = keyBounds.find(({ rect }) =>
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
        );

        if (!key) return;

        const pitch = key.pitch;

        // Velocity from click position within the key
        const velocity = Math.floor(((clientY - key.rect.top) / key.rect.height) * 126) + 1;

        // Fake MIDI message
        const statusByte = (command << 4) | midiInputChannel;

        onMidiMessage(
            { data: new Uint8Array([statusByte, pitch, velocity]) },
            ON_SCREEN_KEYBOARD,
            setNotesOn, setCCsOn
        );
    };

    return (
        <section
            ref={containerRef}
            className={styles['piano-keyboard']}
            onMouseDown={(e) => keyHandler(e, NOTE_ON)}
            onMouseUp={(e) => keyHandler(e, NOTE_OFF)}
        >
            {midiPitches.map((pitch) => (
                <PianoKey
                    key={pitch}
                    pitch={pitch}
                    isHighlighted={!!notesOn[pitch]}
                />
            ))}
        </section>
    );
}

PianoKeyboard.propTypes = {
    midiInputChannel: PropTypes.number.isRequired,
};
