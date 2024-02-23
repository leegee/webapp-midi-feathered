// onMidiMessage
import { MIDI_CHANNEL, NOTE_OFF, NOTE_ON } from './constants';

export function startMidiNote ( pitch , velocity, selectedOutput ) {
    console.log( "START MIDI NOTE", pitch, velocity )
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

export function stopMidiNote ( pitch, selectedOutput ) {
    console.log( "STOP MIDI NOTE", pitch )
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
            startMidiNote( pitch, velocity, selectedOutputRef.current );
        }
        
        else if (cmd === NOTE_OFF || velocity === 0) {
            if ( newNotesOn[ pitch ] ) {
                console.log( `NOTE OFF ${ cmd } pitch:${ pitch }: duration:${ timestamp - newNotesOn[ pitch ].timestamp } ms.` );
                stopMidiNote(newNotesOn[pitch], selectedOutputRef.current );
                delete newNotesOn[ pitch ];
            }
        }
        
        else {
            console.log('---MIDI msg unprocessed:', cmd, pitch, velocity)
        }

        return newNotesOn;
    });
}
