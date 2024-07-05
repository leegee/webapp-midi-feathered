import { useAtom } from 'jotai';
import { midiOutputChannelsAtom } from '../lib/store';
import styles from './OutputChannelSelect.module.css';

export default function OutputChannelSelect () {
    const [ midiOutputChannels, setMidiOutputChannels ] = useAtom( midiOutputChannelsAtom );

    const handleOutputChange = ( event ) => {
        const options = event.target.options;
        const selectedValues = [];
        for ( let i = 0, l = options.length; i < l; i++ ) {
            if ( options[ i ].selected ) {
                selectedValues.push( Number( options[ i ].value ) );
            }
        }
        console.log( 'Set MIDI output channels: ', selectedValues );
        setMidiOutputChannels( selectedValues );
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
                    <option key={ item + 1 } value={ item + 1 }>
                        { item + 1 }
                    </option>
                ) ) }
            </select>
            <small>CTRL click to select multiple</small>
        </aside>
    );
}
