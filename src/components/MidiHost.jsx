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
// import PianoKeyboard from './WebGL';
import Featherise from './Featherise';
import NotesOnCanvas from './NotesOnCanvas';
import Dialog from './Dialog';
import styles from './MIDI.module.css';

let watchMidiInitialized = false;

export default function MIDIComponent() {
    const [midiAccess, setMidiAccess] = useAtom(midiAccessAtom);
    const [midiOutputs, setMidiOutputs] = useAtom(midiOutputsAtom);
    const [selectedOutput, setSelectedOutput] = useAtom(selectedOutputAtom);
    const [midiInputChannel] = useAtom(midiInputChannelAtom);
    const [, setNotesOn] = useAtom(notesOnAtom);
    const [, setCCsOn] = useAtom(CCsOnAtom);

    const selectedOutputRef = useRef(null);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
    const [showKeys, setShowKeys] = useState(true);
    const [showPianoRoll, setShowPianoRoll] = useState(true);
    const [showFeatherize, setShowFeatherize] = useState(true);

    useEffect(() => {
        if (!midiAccess) {
            try {
                navigator.requestMIDIAccess().then((midiAccess) =>
                    setMidiAccess(midiAccess)
                );
            } catch (error) {
                console.error('Failed to access MIDI devices:', error);
                return (
                    <div className="error">
                        Failed to access MIDI devices: ${error}
                    </div>
                );
            }
        } else if (!watchMidiInitialized) {
            setMidiOutputs(() => {
                const newOutputs = Array.from(midiAccess.outputs.values()).reduce(
                    (map, output) => {
                        map[output.name] = output;
                        return map;
                    },
                    {}
                );

                // Initialize the first MIDI output as the default selectedOutput
                const firstOutputName = Object.keys(newOutputs)[0];
                setSelectedOutput(() => {
                    selectedOutputRef.current = newOutputs[firstOutputName];

                    midiAccess.inputs.forEach((inputPort) => {
                        inputPort.onmidimessage = (event) =>
                            onMidiMessage(event, midiInputChannel, setNotesOn, setCCsOn);
                    });

                    return firstOutputName;
                });

                return newOutputs;
            });

            watchMidiInitialized = true;
        }
    }, [midiAccess, setMidiAccess, midiOutputs, setMidiOutputs, setNotesOn, setSelectedOutput, selectedOutput, midiInputChannel, setCCsOn]);

    useEffect(() => {
        if (midiOutputs[selectedOutput]) {
            selectedOutputRef.current = midiOutputs[selectedOutput];
            console.log('Have now a selected MIDI output:', selectedOutputRef.current);
        }
    }, [selectedOutput, midiOutputs]);

    return (
        <main className={styles.main}>

            <header className={styles.header}>
                <h1>MIDI</h1>
                <span>
                    <button onClick={() => setShowFeatherize(prev => !prev)}>Featherize</button>
                    <button onClick={() => setShowKeys(prev => !prev)}>Keys</button>
                    <button onClick={() => setShowPianoRoll(prev => !prev)}>Piano Roll</button>
                    <button onClick={() => setIsSettingsDialogOpen(true)}>MIDI Settings</button>
                    <button onClick={() => setIsHelpDialogOpen(true)}>?</button>
                </span>
            </header>

            {
                selectedOutputRef.current && showFeatherize && (
                    <Featherise selectedOutput={selectedOutputRef.current} vertical={true} height='50vh' />
                )
            }

            {
                (showKeys || showPianoRoll) && (
                    <footer className={styles.footer}>
                        {showPianoRoll && <NotesOnCanvas />}
                        {showKeys && <PianoKeyboard midiInputChannel={midiInputChannel} />}
                    </footer>
                )
            }

            <Dialog isOpen={isSettingsDialogOpen} onClose={() => setIsSettingsDialogOpen(false)}>
                <h2>MIDI Settings</h2>
                <DeviceSelect />
                <InputChannelSelect />
                <OutputChannelSelect />
            </Dialog>

            <Dialog isOpen={isHelpDialogOpen} onClose={() => setIsHelpDialogOpen(false)}>
                <h2>Help</h2>
                <p>
                    This is an experiment that coincidentally replicates Bear McCreary&apos;s<br />
                    custom plug-in used in the creation of The Foundation soundtrack.
                </p>
                <ol>
                    <li>Set the MIDI device and I/O channels</li>
                    <li>The app will remember your settings</li>
                    <li>Play a note or more and adjust the ranges of the featherise settings</li>
                </ol>
            </Dialog>
        </main >
    );
}
