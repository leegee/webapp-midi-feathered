import { useAtom } from 'jotai';

import { midiOutputChannelAtom } from '../lib/store';

export default function InputChannelSelect () {
    const [ midiOutputChannel, setMidiOutputChannel ] = useAtom( midiOutputChannelAtom );

    const handleOutputChange = ( event ) => {
        console.log( 'Set MIDI output channel: ', event.target.value );
        setMidiOutputChannel( Number( event.target.value ) );
    };

    return (
        <aside>
            <label htmlFor="midi-input-channel-selector">MIDI Input Channel: </label>
            <select id="midi-input-channel-selector" onChange={ handleOutputChange } value={ midiOutputChannel }>
                { Array.from( Array( 16 ).keys() ).map( ( item ) => (
                    <option key={ item + 1 } value={ item + 1 }>{ item + 1 }</option>
                ) ) }
            </select>
        </aside>
    );
}
