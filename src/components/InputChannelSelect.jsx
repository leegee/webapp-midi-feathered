import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { saveNow } from '../lib/local-storage';
import { midiInputChannelAtom } from '../lib/store';

export default function InputChannelSelect () {
    const [ midiInputChannel, setMidiInputChannel ] = useAtom( midiInputChannelAtom );

    const handleOutputChange = ( event ) => {
        console.log( 'Set MIDI input channel: ', event.target.value );
        setMidiInputChannel( Number( event.target.value ) );
        saveNow( { midiInputChannel: event.target.value } );
    };

    useEffect( () => {
        const savedInputChannelsStr = localStorage.getItem( 'midiInputChannels' );
        if ( savedInputChannelsStr ) {
            const savedMidiOutputChannels = savedInputChannelsStr.split( ',' ).map( channel => Number( channel ) );
            setMidiInputChannel( savedMidiOutputChannels );
        }
    }, [ setMidiInputChannel ] );


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
