// onMidiMessage
import { Note } from "tonal";

const MIDI_CHANNEL = 1;
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

function sendMidiNotes ( { notes, velocity, selectedOutput } ) {
    let t = 0;
    for (const note of notes) {
        setTimeout(
            () => {
                selectedOutput.send( [
                    0x90 + ( MIDI_CHANNEL - 1 ),
                    note, velocity
                ] );
                console.log('SEND NOTE ON', note, '@', velocity, 'to', selectedOutput.name);
            },
            t += 100
        );
    }
}

function startMidiNote ( pitch , velocity, selectedOutput ) {
    console.log( "START NOTE ON", pitch )
    setTimeout(
        () => {
            selectedOutput.send( [
                0x90 + ( MIDI_CHANNEL - 1 ),
                pitch, velocity
            ] );
        },
        0
    );
}

function stopMidiNote ( pitch, selectedOutput ) {
    console.log( "SEND NOTE OFF", pitch )
    setTimeout(
        () => {
            selectedOutput.send( [
                0x80 + ( MIDI_CHANNEL - 1 ),
                pitch, 0
            ] );
        },
        0
    );
}

export function onMidiMessage ( event, setNotesOn, scaleNotesRef, selectedOutputRef ) {
    const timestamp = Date.now();
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;

    setNotesOn((prevNotesOn) => {
        const newNotesOn = { ...prevNotesOn };

        if (cmd === NOTE_ON && velocity > 0 && !newNotesOn[pitch]) {
            console.log(`NOTE ON ${cmd} pitch:${pitch}, velocity: ${velocity}`);
            newNotesOn[pitch] = { timestamp, velocity };
            // const triad = getTriadNoteNames(pitch, scaleNotesRef.current);
            // sendMidiNotes({ notes: triad, velocity, selectedOutput: selectedOutputRef.current });
            startMidiNote(pitch, velocity, selectedOutputRef.current );
        }
        
        else if (cmd === NOTE_OFF || velocity === 0) {
            if ( newNotesOn[ pitch ] ) {
                console.log( `NOTE OFF ${ cmd } pitch:${ pitch }: duration:${ timestamp - newNotesOn[ pitch ].timestamp } ms.` );
                stopMidiNote(newNotesOn[pitch], selectedOutputRef.current );
                delete newNotesOn[ pitch ];
            }
        } else {
            console.log('---MIDI msg unprocessed:', cmd, pitch, velocity)
        }

        return newNotesOn;
    });
}
