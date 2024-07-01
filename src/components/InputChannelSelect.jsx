import { useAtom } from 'jotai';

import { midiInputChannelAtom } from '../lib/store';

export default function InputChannelSelect () {
    const [ midiInputChannel, setMidiInputChannel ] = useAtom( midiInputChannelAtom );

    const handleOutputChange = ( event ) => {
        console.log( 'Set MIDI input channel: ', event.target.value );
        setMidiInputChannel( Number( event.target.value ) );
    };

    return (
        <aside>
            <label htmlFor="midi-input-channel-selector">MIDI Input Channel: </label>
            <select id="midi-input-channel-selector" onChange={ handleOutputChange } value={ midiInputChannel }>
                { Array.from( Array( 16 ).keys() ).map( ( item ) => (
                    <option key={ item + 1 } value={ item + 1 }>{ item + 1 }</option>
                ) ) }
            </select>
        </aside>
    );
}
