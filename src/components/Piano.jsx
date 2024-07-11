import PropTypes from 'prop-types';
import { useAtom } from 'jotai';

import { notesOnAtom, CCsOnAtom } from '../lib/store';
import { NOTE_ON, NOTE_OFF, onMidiMessage } from '../lib/midi-messages';

import styles from './Piano.module.css';

const BLACK_KEYS = [ 1, 3, 6, 8, 10 ];

const PianoKey = ( { pitch, isHighlighted } ) => {
    const isBlackKey = BLACK_KEYS.includes( pitch % 12 );

    return (
        <span
            data-pitch={ `${ pitch }` }
            className={ `${ styles[ 'piano-key' ] } ${ isHighlighted ? styles[ 'piano-key-highlighted' ] : '' } ${ isBlackKey ? styles[ 'piano-key-black' ] : 'piano-key-white' }` }
        />
    );
};

PianoKey.propTypes = {
    pitch: PropTypes.number.isRequired,
    isHighlighted: PropTypes.bool.isRequired,
};

export default function PianoKeyboard ( { midiInputChannel } ) {
    const [ notesOn, setNotesOn ] = useAtom( notesOnAtom );
    const [ , setCCsOn ] = useAtom( CCsOnAtom );

    // 88 keys from A0 @ MIDI pitch 21
    const midiPitches = Array.from( { length: 88 }, ( _, index ) => index + 21 );

    const keyHandler = ( event, command ) => {
        const pitch = event.target.dataset.pitch;

        // Velocity 1-127 from click position within the key
        const rect = event.target.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const velocity = Math.floor( ( clickY / rect.height ) * 126 ) + 1;

        console.log( `Key with pitch ${ pitch } velocity ${ velocity } ${ command === NOTE_ON ? 'on' : 'off' }` );

        // Fake a MIDI input message
        const statusByte = ( command << 4 ) | midiInputChannel;
        onMidiMessage(
            { data: new Uint8Array( [ statusByte, pitch, velocity ] ) },
            null, setNotesOn, setCCsOn
        );
    };

    return (
        <section className={ styles[ 'piano-keyboard' ] } onMouseDown={ ( e ) => keyHandler( e, NOTE_ON ) } onMouseUp={ ( e ) => keyHandler( e, NOTE_OFF ) }>
            <div>
                { midiPitches.map( ( pitch ) => (
                    <PianoKey
                        key={ pitch }
                        pitch={ pitch }
                        isHighlighted={ !!notesOn[ pitch ] }
                    />
                ) ) }
            </div>
        </section>
    );
}

PianoKeyboard.propTypes = {
    midiInputChannel: PropTypes.number.isRequired,
}