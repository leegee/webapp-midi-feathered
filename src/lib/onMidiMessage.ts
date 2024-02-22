// onMidiMessage
import { Note } from "tonal";

const MIDI_CHANNEL = 0x90;
const NOTE_ON = 9;
const NOTE_OFF = 8;

function getTriadNoteNames(midiPitch, scaleNotes) {
    const [rootNote, octaveNumber] = Note.fromMidi(midiPitch).split('');
    const rootIndex = scaleNotes.indexOf(rootNote);
    if (rootIndex === -1) {
        throw new Error(`The MIDI pitch ${rootNote} does not correspond to any note in the scale: ${scaleNotes.join(' ')}`);
    }

    const thirdIndex = (rootIndex + 2) % scaleNotes.length;
    const fifthIndex = (rootIndex + 4) % scaleNotes.length;

    const triad = [
        Note.get(rootNote + octaveNumber).midi,
        Note.get(scaleNotes[thirdIndex] + octaveNumber).midi,
        Note.get(scaleNotes[fifthIndex] + octaveNumber).midi,
    ];

    return triad;
}

function playNotes({ notes, velocity, selectedOutput }) {
    for (const note of notes) {
        console.log('note', note, ' @ ', velocity);
        selectedOutput.send([MIDI_CHANNEL, note, velocity]); // Note On message (channel 1, note 60, velocity 100)
    }
}

export function onMidiMessage(event, setNotesOn, scaleNotes, selectedOutputRef) {
    const timestamp = Date.now();
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;

    setNotesOn((prevNotesOn) => {
        const newNotesOn = { ...prevNotesOn };

        if (cmd === NOTE_ON && velocity > 0 && !newNotesOn[pitch]) {
            console.log(`NOTE ON pitch:${pitch}, velocity: ${velocity}`);
            newNotesOn[pitch] = { timestamp, velocity };
            const triad = getTriadNoteNames(pitch, scaleNotes);
            playNotes({ notes: triad, velocity, selectedOutput: selectedOutputRef.current });
        }
        else if (cmd === NOTE_OFF || velocity === 0) {
            if (newNotesOn[pitch]) {
                console.log(`NOTE OFF pitch:${pitch}: duration:${timestamp - newNotesOn[pitch].timestamp} ms.`);
                delete newNotesOn[pitch];
            }
        }

        return newNotesOn;
    });
}
