/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import styles from './ChordNoteRandomiserComponent.module.css';

import { notesOnAtom } from '../lib/store';
import { sendNoteWithDuration } from '../lib/midi-messages';

const INITIAL_BPS = 6;
const durationMs = 1000;

ChordNoteRandomiserComponent.propTypes = {
    selectedOutput: PropTypes.object.isRequired,
};

export default function ChordNoteRandomiserComponent ( { selectedOutput } ) {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ bps, setBps ] = useState( INITIAL_BPS );
    const [ playMode, setPlayMode ] = useState( 'oneNote' ); // State for play mode: 'oneNote' or 'probability'
    const [ probabilityThreshold, setProbabilityThreshold ] = useState( 0.5 ); // State for probability slider

    const handleChangeBps = ( event ) => {
        setBps( Number( event.target.value ) );
    };

    const handlePlayModeChange = ( event ) => {
        setPlayMode( event.target.value );
    };

    const handleProbabilityChange = ( event ) => {
        setProbabilityThreshold( Number( event.target.value ) );
    };

    function bpsListener () {
        const pitches = Object.keys( notesOn );
        if ( !pitches.length ) {
            return;
        }

        if ( playMode === 'oneNote' ) {
            // Always play one random note
            const pitch = pitches[ Math.floor( Math.random() * pitches.length ) ];
            sendNoteWithDuration(
                pitch,
                notesOn[ pitch ].velocity,
                durationMs,
                selectedOutput
            );
        } else if ( playMode === 'probability' ) {
            // Iterate through all notes based on the probability threshold
            Object.keys( notesOn ).forEach( ( pitch ) => {
                const probability = Math.random(); // Random number between 0 and 1
                if ( probability < probabilityThreshold ) {
                    sendNoteWithDuration(
                        pitch,
                        notesOn[ pitch ].velocity,
                        durationMs,
                        selectedOutput
                    );
                }
            } );
        }
    }

    useEffect( () => {
        const bpsInterval = 1000 / bps;
        const bpsTimer = setInterval( bpsListener, bpsInterval );
        return () => clearInterval( bpsTimer );
    }, [ bps, notesOn, playMode, probabilityThreshold ] );

    return (
        <section className="padded">
            <h2>Chord-note Randomiser</h2>

            <div className={ styles.row }>
                <input
                    type="radio"
                    value="oneNote"
                    checked={ playMode === 'oneNote' }
                    onChange={ handlePlayModeChange }
                />
                <label>Notes per second</label>
                <input
                    className={ styles.bpsInput }
                    type="range"
                    value={ bps }
                    onChange={ handleChangeBps }
                    min="1"
                    max="10"
                    disabled={playMode !== 'oneNote'}
                />
                { bps } notes/sec
            </div>

            <div className={ styles.row }>
                <input
                    type="radio"
                    value="probability"
                    checked={ playMode === 'probability' }
                    onChange={ handlePlayModeChange }
                />
                <label>Probability threshold</label>
                <input
                    className={ styles.probabilityInput }
                    type="range"
                    value={ probabilityThreshold }
                    onChange={ handleProbabilityChange }
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={playMode !== 'probability'}
                />
                { probabilityThreshold.toFixed( 2 ) * 100 }%
            </div>

        </section>
    );
}
