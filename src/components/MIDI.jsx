import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';

import {
    CCsOnAtom,
    midiAccessAtom,
    midiOutputsAtom,
    selectedOutputAtom,
    midiInputChannelAtom,
    notesOnAtom,
} from '../lib/store';
import { onMidiMessage } from '../lib/midi-messages';
import InputChannelSelect from './InputChannelSelect';
import OutputChannelSelect from './OutputChannelSelect';
import DeviceSelect from './DeviceSelect';
import PianoKeyboard from './Piano';
import Featherise from './Featherise';
import NotesOnCanvas from './NotesOnCanvas';
import Dialog from './Dialog';
import styles from './MIDI.module.css';

let watchMidiInitialized = false;

export default function MIDIComponent () {
    const [ midiAccess, setMidiAccess ] = useAtom( midiAccessAtom );
    const [ midiOutputs, setMidiOutputs ] = useAtom( midiOutputsAtom );
    const [ selectedOutput, setSelectedOutput ] = useAtom( selectedOutputAtom );
    const [ midiInputChannel ] = useAtom( midiInputChannelAtom );
    const [ , setNotesOn ] = useAtom( notesOnAtom );
    const [ , setCCsOn ] = useAtom( CCsOnAtom );

    const selectedOutputRef = useRef( null );
    const [ isDialogOpen, setIsDialogOpen ] = useState( false );
    const [ showExtras, setShowExtras ] = useState( true );

    useEffect( () => {
        if ( !midiAccess ) {
            try {
                navigator.requestMIDIAccess().then( ( midiAccess ) =>
                    setMidiAccess( midiAccess )
                );
            } catch ( error ) {
                console.error( 'Failed to access MIDI devices:', error );
                return (
                    <div className="error">
                        Failed to access MIDI devices: ${ error }
                    </div>
                );
            }
        } else if ( !watchMidiInitialized ) {
            setMidiOutputs( () => {
                const newOutputs = Array.from( midiAccess.outputs.values() ).reduce(
                    ( map, output ) => {
                        map[ output.name ] = output;
                        return map;
                    },
                    {}
                );

                // Initialize the first MIDI output as the default selectedOutput
                const firstOutputName = Object.keys( newOutputs )[ 0 ];
                setSelectedOutput( () => {
                    selectedOutputRef.current = newOutputs[ firstOutputName ];

                    midiAccess.inputs.forEach( ( inputPort ) => {
                        inputPort.onmidimessage = ( event ) =>
                            onMidiMessage( event, midiInputChannel, setNotesOn, setCCsOn );
                    } );

                    return firstOutputName;
                } );

                return newOutputs;
            } );

            watchMidiInitialized = true;
        }
    }, [ midiAccess, setMidiAccess, midiOutputs, setMidiOutputs, setNotesOn, setSelectedOutput, selectedOutput, midiInputChannel, setCCsOn ] );

    useEffect( () => {
        if ( midiOutputs[ selectedOutput ] ) {
            selectedOutputRef.current = midiOutputs[ selectedOutput ];
            console.log( 'Have now a selected MIDI output:', selectedOutputRef.current );
        }
    }, [ selectedOutput, midiOutputs ] );

    return (
        <main className={ styles.main }>

            <header className={ styles.header }>
                <h1>MIDI</h1>
                <span>
                    <button onClick={ () => setShowExtras( prev => !prev ) }>Note Display</button>
                    <button onClick={ () => setIsDialogOpen( true ) }>MIDI Settings</button>
                </span>
            </header>

            { selectedOutputRef.current && (
                <Featherise selectedOutput={ selectedOutputRef.current } vertical={ true } />
            ) }

            { showExtras && (
                <footer className={ styles.footer }>
                    <NotesOnCanvas />
                    <PianoKeyboard midiInputChannel={ midiInputChannel } />
                </footer>
            ) }

            <Dialog isOpen={ isDialogOpen } onClose={ () => setIsDialogOpen( false ) }>
                <h2>MIDI Settings</h2>
                <DeviceSelect />
                <InputChannelSelect />
                <OutputChannelSelect />
            </Dialog>
        </main >
    );
}
