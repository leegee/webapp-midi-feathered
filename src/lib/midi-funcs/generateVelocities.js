import { describe, it, expect, vi } from 'vitest';

import { probabilityTriangular } from '../maths';
import { generateVelocity } from '../midi-funcs';

vi.mock( './maths', () => ( {
    probabilityTriangular: vi.fn(),
} ) );

vi.mock( './midi-messages', () => ( {
    startMidiNote: vi.fn(),
    stopMidiNote: vi.fn(),
    EVENT_NOTE_START: 'noteStart',
    EVENT_NOTE_STOP: 'noteStop',
} ) );

describe( 'generateVelocity', () => {
    it( 'should generate a velocity within the correct range', () => {
        const playedNoteVelocity = 64;
        const velocityRange = { minValue: -50, maxValue: 50 };

        probabilityTriangular.mockReturnValueOnce( 1.25 ); // Mock the return value of probabilityTriangular

        const result = generateVelocity( playedNoteVelocity, velocityRange );
        expect( result ).toBeGreaterThanOrEqual( 0 );
        expect( result ).toBeLessThanOrEqual( 127 );
    } );

    it( 'should cap the velocity at 127', () => {
        const playedNoteVelocity = 200;
        const velocityRange = { minValue: 0, maxValue: 100 };

        probabilityTriangular.mockReturnValueOnce( 2 ); // Mock the return value of probabilityTriangular

        const result = generateVelocity( playedNoteVelocity, velocityRange );
        expect( result ).toBe( 127 );
    } );

    it( 'should not generate a negative velocity', () => {
        const playedNoteVelocity = 1;
        const velocityRange = { minValue: -50, maxValue: -25 };

        probabilityTriangular.mockReturnValueOnce( 0.5 ); // Mock the return value of probabilityTriangular

        const result = generateVelocity( playedNoteVelocity, velocityRange );
        expect( result ).toBeGreaterThanOrEqual( 0 );
    } );
} );


