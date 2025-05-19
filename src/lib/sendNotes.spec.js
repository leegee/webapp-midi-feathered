import { describe, it, expect, vi, afterEach } from 'vitest';
import { probabilityTriangular } from './maths';
import { sendNotes, sendNoteWithDuration } from './midi-funcs'; // Import only sendNotes
import { startMidiNote, stopMidiNote } from './midi-messages'; // Import these for mocking

vi.mock('./maths', () => ({
    probabilityTriangular: vi.fn(),
}));

vi.mock('./midi-messages', () => ({
    startMidiNote: vi.fn(), // Mock startMidiNote
    stopMidiNote: vi.fn(),  // Mock stopMidiNote
    EVENT_NOTE_START: 'noteStart',
    EVENT_NOTE_STOP: 'noteStop',
}));

afterEach(vi.resetAllMocks);

describe('sendNotes', () => {
    it('should send notes correctly', () => {
        const notesOn = { 60: 100, 64: 100, 67: 100 };
        const rangeState = {
            playMode: 1,
            polyProbRange: { minValue: 0.3, maxValue: 0.7 },
            speedRange: { minValue: 200, maxValue: 800 },
            velocityRange: { minValue: -20, maxValue: 20 },
            octaveRange: { minValue: 3, maxValue: 5 },
            extensionsProbRange: { minValue: 0.2, maxValue: 0.8 },
        };
        const extensions = { 2: true, 4: false, 5: true };
        const midiOutputChannels = [1, 2, 3];
        const selectedOutput = { send: vi.fn() };

        // Mock the return value of probabilityTriangular
        probabilityTriangular.mockReturnValue(0.5);

        // Call sendNotes, which should internally call startMidiNote
        sendNotes(notesOn, rangeState, extensions, midiOutputChannels, selectedOutput);

        // Check that startMidiNote was called
        expect(startMidiNote).toHaveBeenCalled(); // Check if startMidiNote was called

        // Optionally, check the specific parameters if needed
        expect(startMidiNote).toHaveBeenCalledWith(
            expect.any(Number), // pitch
            expect.any(Number), // velocity
            selectedOutput,
            expect.any(Number) // midiChannel
        );
    });
});

describe('sendNoteWithDuration', () => {
    it('should start and stop a note with the given duration', () => {
        const pitch = 60;
        const velocity = 100;
        const durationMs = 500;
        const selectedOutput = {};
        const midiChannel = 1;

        vi.useFakeTimers();

        // Call sendNoteWithDuration directly
        sendNoteWithDuration(pitch, velocity, durationMs, selectedOutput, midiChannel);

        // Expect startMidiNote to have been called first
        expect(startMidiNote).toHaveBeenCalledWith(pitch, velocity, selectedOutput, midiChannel);

        // Advance time by durationMs to trigger the stop
        vi.advanceTimersByTime(durationMs);

        // Now expect stopMidiNote to have been called
        expect(stopMidiNote).toHaveBeenCalledWith(pitch, selectedOutput, midiChannel);
    });

    it('should clear existing timer if note is already playing', () => {
        const pitch = 60;
        const velocity = 100;
        const durationMs = 500;
        const selectedOutput = {};
        const midiChannel = 1;

        vi.useFakeTimers();

        // First call to sendNoteWithDuration
        sendNoteWithDuration(pitch, velocity, durationMs, selectedOutput, midiChannel);
        // Second call should clear the first timer
        sendNoteWithDuration(pitch, velocity, durationMs, selectedOutput, midiChannel);

        // stopMidiNote should have been called only once after the first timer was cleared
        expect(stopMidiNote).toHaveBeenCalledTimes(1);

        // Advance timers to complete the second duration
        vi.advanceTimersByTime(durationMs);

        // Ensure stopMidiNote is called after advancing time
        expect(stopMidiNote).toHaveBeenCalledWith(pitch, selectedOutput, midiChannel);
    });
});
