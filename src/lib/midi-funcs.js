import { startMidiNote, stopMidiNote } from './midi-messages';
import { EVENT_NOTE_START, EVENT_NOTE_STOP } from './midi-messages';
import { probabilityTriangular } from './maths';

export const playModeTypes = {
    MONO: 0,
    POLY: 1,
};

const timersForPitches = {};
const DISPATCH_EVENTS_FOR_EXTRAS = true;

// Either a CC value or based on teh note velocity adjusted by  the range
export const generateVelocity = (playedNoteVelocity, velocityRange) => {
    const { maxValue, minValue } = velocityRange;
    const minPercentageFactor = 1 + (minValue / 100);
    const maxPercentageFactor = 1 + (maxValue / 100);
    const adjustedVelocity = playedNoteVelocity * probabilityTriangular(minPercentageFactor, maxPercentageFactor);
    return Math.min(Math.max(adjustedVelocity, 0), 127);
};

export const sendNotes = (notesOn, rangeState, extensions, midiOutputChannels, selectedOutput) => {
    const pitches = Object.keys(notesOn);
    if (!pitches.length) {
        return;
    }
    const usePitches = rangeState.playMode === playModeTypes.MONO
        ? [Number(pitches[Math.floor(Math.random() * pitches.length)])]
        : Object.keys(notesOn).filter(() => {
            const probability = probabilityTriangular(0, 1);
            return probability < rangeState.polyProbRange.maxValue && probability > rangeState.polyProbRange.minValue;
        }).map(usePitch => Number(usePitch));

    usePitches.forEach((aPitch) => {
        const useDurationMs = rangeState.speedRange.minValue + Math.random() * (rangeState.speedRange.maxValue - rangeState.speedRange.minValue);
        const useVelocity = generateVelocity(notesOn[[aPitch]], rangeState.velocityRange);

        const useOctave = (Math.floor(
            rangeState.octaveRange.minValue == rangeState.octaveRange.maxValue
                ? rangeState.octaveRange.minValue
                : probabilityTriangular(rangeState.octaveRange.minValue, rangeState.octaveRange.maxValue)
        ) - 1) * 12;

        const shallUseExtensions = Math.random() > probabilityTriangular(rangeState.extensionsProbRange.minValue, rangeState.extensionsProbRange.maxValue);
        let useExtension = 0;
        if (shallUseExtensions) {
            const activeExtensions = Object.keys(extensions).filter(ext => extensions[ext]);
            useExtension = Number(activeExtensions[Math.floor(Math.random() * activeExtensions.length)]);
        }

        let usePitch = aPitch + useOctave + useExtension;

        // Reverse the octave if it puts the note out of range
        if (usePitch >= 127 || usePitch < 28) {
            usePitch -= useOctave;
            if (usePitch >= 127 || usePitch < 28) {
                usePitch -= useExtension;
            }
        }

        const midiOutputChannel = midiOutputChannels.length == 1
            ? midiOutputChannels[0]                                                        // Use the only output selected
            : midiOutputChannels[Math.floor(Math.random() * midiOutputChannels.length)]; // Use a random output channel

        if (isNaN(usePitch)) {
            console.warn('-- sendNotes', usePitch)
        }

        try {
            sendNoteWithDuration(usePitch, useVelocity, useDurationMs, selectedOutput, midiOutputChannel);
        }
        catch (e) {
            console.error(`usePitch was ${usePitch}`);
            throw e;
        }
    });
}

export function sendNoteWithDuration(pitch, velocity, durationMs, selectedOutput, midiChannel) {
    // If the note is playing already, stop it
    if (Object.hasOwn(timersForPitches, pitch)) {
        clearTimeout(timersForPitches[pitch]);
        stopMidiNote(pitch, selectedOutput, midiChannel);
    }

    startMidiNote(pitch, velocity, selectedOutput, midiChannel);

    if (DISPATCH_EVENTS_FOR_EXTRAS) {
        window.dispatchEvent(
            new CustomEvent(EVENT_NOTE_START, { detail: { pitch, velocity, midiChannel } })
        );
    }

    const timer = setTimeout(
        () => {
            stopMidiNote(pitch, selectedOutput, midiChannel);
            delete timersForPitches[pitch];
            if (DISPATCH_EVENTS_FOR_EXTRAS) {
                window.dispatchEvent(
                    new CustomEvent(EVENT_NOTE_STOP, { detail: { pitch, velocity, midiChannel } })
                );
            }

        },
        durationMs
    );

    timersForPitches[pitch] = timer;
}

