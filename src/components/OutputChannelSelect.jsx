import { useEffect } from 'react';
import { useAtom } from 'jotai';
import styles from './OutputChannelSelect.module.css';
import { midiInputChannelAtom, midiOutputChannelsAtom } from '../lib/store';
import { saveNow } from '../lib/local-storage';

export default function OutputChannelSelect () {
    const [ midiOutputChannels, setMidiOutputChannels ] = useAtom( midiOutputChannelsAtom );
    const [ midiInputChannel ] = useAtom( midiInputChannelAtom );

    useEffect( () => {
        const savedOutputChannelsStr = localStorage.getItem( 'midiOutputChannels' );
        if ( savedOutputChannelsStr ) {
            const savedMidiOutputChannels = savedOutputChannelsStr.split( ',' ).map( channel => Number( channel ) );
            setMidiOutputChannels( savedMidiOutputChannels );
        }
    }, [ setMidiOutputChannels ] );

    const handleOutputChange = ( event ) => {
        const options = event.target.options;
        const selectedValues = [];
        for ( let i = 0, l = options.length; i < l; i++ ) {
            if ( options[ i ].selected && options[ i ].value !== midiInputChannel ) {
                selectedValues.push( Number( options[ i ].value ) );
            }
        }
        console.log( 'Set MIDI output channels: ', selectedValues );
        setMidiOutputChannels( selectedValues );
        saveNow( { midiOutputChannels: selectedValues } );

    };

    return (
        <aside className={ styles[ 'midi-output-channel-selector-component' ] }>
            <label htmlFor="midi-output-channel-selector">MIDI Output Channels: </label>
            <select
                id="midi-output-channel-selector"
                multiple
                onChange={ handleOutputChange }
                value={ midiOutputChannels }
            >
                { Array.from( Array( 16 ).keys() ).map( ( item ) => (
                    <option key={ item + 1 }
                        value={ item + 1 }
                        disabled={ item + 1 === midiInputChannel }
                        title={ item + 1 === midiInputChannel ? 'This is the input channel' : `Channel ${ item + 1 } is available` }
                    >
                        { item + 1 }
                    </option>
                ) ) }
            </select>
            <small>CTRL click to select multiple</small>
        </aside>
    );
}
