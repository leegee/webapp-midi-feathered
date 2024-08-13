import { describe, it, expect, vi, afterEach } from 'vitest';

import { probabilityTriangular } from '../maths';
import { sendNotes, sendNoteWithDuration } from '../midi-funcs';
import { startMidiNote, stopMidiNote } from '../midi-messages';

vi.mock( './maths', () => ( {
    probabilityTriangular: vi.fn(),
} ) );

vi.mock( './midi-messages', () => ( {
    startMidiNote: vi.fn(),
    stopMidiNote: vi.fn(),
    EVENT_NOTE_START: 'noteStart',
    EVENT_NOTE_STOP: 'noteStop',
} ) );

vi.mock( './midi-funcs', () => ( {
    sendNoteWithDuration: vi.fn()
} ) );

afterEach( vi.resetAllMocks );

describe( 'sendNotes', () => {
    it( 'should send notes correctly', () => {
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
        const midiOutputChannels = [ 1, 2, 3 ];
        const selectedOutput = {};

        probabilityTriangular.mockReturnValue( 0.5 );

        sendNotes( notesOn, rangeState, extensions, midiOutputChannels, selectedOutput );

        expect( sendNoteWithDuration ).toHaveBeenCalled();
    } );

    it( 'should not send notes if no pitches are on', () => {
        const notesOn = {};
        const rangeState = {
            playMode: 1,
            polyProbRange: { minValue: 0.3, maxValue: 0.7 },
            speedRange: { minValue: 200, maxValue: 800 },
            velocityRange: { minValue: -20, maxValue: 20 },
            octaveRange: { minValue: 3, maxValue: 5 },
            extensionsProbRange: { minValue: 0.2, maxValue: 0.8 },
        };
        const extensions = { 2: true, 4: false, 5: true };
        const midiOutputChannels = [ 1, 2, 3 ];
        const selectedOutput = {};

        sendNotes( notesOn, rangeState, extensions, midiOutputChannels, selectedOutput );

        expect( sendNoteWithDuration ).not.toHaveBeenCalled();
    } );
} );



describe( 'sendNoteWithDuration', () => {
    it( 'should start and stop a note with the given duration', () => {
        const pitch = 60;
        const velocity = 100;
        const durationMs = 500;
        const selectedOutput = {};
        const midiChannel = 1;

        vi.useFakeTimers();

        sendNoteWithDuration( pitch, velocity, durationMs, selectedOutput, midiChannel );

        expect( startMidiNote ).toHaveBeenCalledWith( pitch, velocity, selectedOutput, midiChannel );
        expect( stopMidiNote ).not.toHaveBeenCalled();

        vi.advanceTimersByTime( durationMs );

        expect( stopMidiNote ).toHaveBeenCalledWith( pitch, selectedOutput, midiChannel );
    } );

    it( 'should clear existing timer if note is already playing', () => {
        const pitch = 60;
        const velocity = 100;
        const durationMs = 500;
        const selectedOutput = {};
        const midiChannel = 1;

        vi.useFakeTimers();

        sendNoteWithDuration( pitch, velocity, durationMs, selectedOutput, midiChannel );
        sendNoteWithDuration( pitch, velocity, durationMs, selectedOutput, midiChannel );

        expect( stopMidiNote ).toHaveBeenCalledTimes( 1 ); // Only one stop should be called after advancing timers

        vi.advanceTimersByTime( durationMs );

        expect( stopMidiNote ).toHaveBeenCalledWith( pitch, selectedOutput, midiChannel );
    } );
} );