// midi-messages.js

export const NOTE_ON = 9;
export const NOTE_OFF = 8;
export const CC = 11;
export const DISPATCH_EVENTS_STD = false;
export const EVENT_NOTE_START = 'note-start';
export const EVENT_NOTE_STOP = 'note-stop';

export function startMidiNote(pitch, velocity, selectedOutput, midiChannel = 0) {
    // console.log('start', selectedOutput.name, midiChannel, pitch, velocity);
    selectedOutput.send([0x90 + midiChannel, pitch, velocity]);
}

export function stopMidiNote(pitch, selectedOutput, midiChannel = 0) {
    // console.log('stop', selectedOutput.name, midiChannel, pitch);
    selectedOutput.send([0x80 + midiChannel, pitch, 0]);
}

/**
 * @fires EVENT_NOTE_START
 * @fires EVENT_NOTE_STOP
*/
export function onMidiMessage(event, midiInputChannel, setNotesOn, setCCsOn) {
    const midiChannel = event.data[0] & 0x0F;

    if (midiChannel !== 0 && midiChannel !== midiInputChannel) {
        return;
    }

    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;

    if (cmd === CC) {
        setCCsOn((prevCCsOn) => {
            return {
                ...prevCCsOn,
                [pitch]: velocity
            }
        });
    }

    else if (cmd === NOTE_ON || cmd === NOTE_OFF) {
        setNotesOn((prevNotesOn) => {
            const newNotesOn = { ...prevNotesOn };

            if (cmd === NOTE_ON && velocity > 0 && !newNotesOn[pitch]) {
                newNotesOn[pitch] = velocity;
                if (DISPATCH_EVENTS_STD) {
                    window.dispatchEvent(
                        new CustomEvent(EVENT_NOTE_START, { detail: { pitch, velocity, midiChannel } })
                    );
                }
            }

            else if (cmd === NOTE_OFF || velocity === 0) {
                if (newNotesOn[pitch]) {
                    delete newNotesOn[pitch];
                    if (DISPATCH_EVENTS_STD) {
                        window.dispatchEvent(
                            new CustomEvent(EVENT_NOTE_STOP, { detail: { pitch, midiChannel } })
                        );
                    }
                }
            }

            return newNotesOn;
        });
    }

    else {
        console.debug(`Unhandled MIDI event - cmd: ${cmd}`)
    }
}
