import { onMidiMessage } from '../src/components/MIDI'; // Import the function to be tested

describe( 'onMidiMessage', () => {
    // Test case for handling NOTE_ON message
    test( 'handles NOTE_ON message correctly', () => {
        const notesOn = {};
        const setNotesOn = jest.fn(); // Mock setNotesOn function

        const event = {
            data: [ 144, 60, 100 ], // MIDI NOTE_ON message (status byte: 144, pitch: 60, velocity: 100)
        };

        onMidiMessage( event, notesOn, setNotesOn );

        // Check if setNotesOn was called with the correct newNotesOn object
        expect( setNotesOn ).toHaveBeenCalledWith( { 60: [ expect.any( Number ), 100 ] } );
    } );

    // Test case for handling NOTE_OFF message
    test( 'handles NOTE_OFF message correctly', () => {
        const notesOn = { 60: [ Date.now(), 100 ] }; // Existing note in notesOn
        const setNotesOn = jest.fn(); // Mock setNotesOn function

        const event = {
            data: [ 128, 60, 0 ], // MIDI NOTE_OFF message (status byte: 128, pitch: 60, velocity: 0)
        };

        onMidiMessage( event, notesOn, setNotesOn );

        // Check if setNotesOn was called with the correct newNotesOn object (note removed)
        expect( setNotesOn ).toHaveBeenCalledWith( {} );
    } );

    // Additional test cases can be added for other scenarios (e.g., handling other MIDI messages)
} );
