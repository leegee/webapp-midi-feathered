import { EVENT_NOTE_START, EVENT_NOTE_STOP } from '../lib/constants';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { notesOnAtom } from '../lib/store';
import styles from './NotesOnCanvas.module.css';

const LOWEST_PITCH = 21;
const NUMBER_OF_NOTES = 88;
const NOTE_HEIGHT = 1;

export default function NoteList () {
    const [ notesOn ] = useAtom( notesOnAtom );
    const canvasRef = useRef( null );
    const [ canvasHeight, setCanvasHeight ] = useState( 0 );
    const bufferCanvasRef = useRef( null ); // Buffer canvas to optimize rendering
    const requestIdRef = useRef( null );

    // State to keep track of playing events
    const [ playingExtraNotes, setPlayingExtraNotes ] = useState( {} );

    useEffect( () => {
        const handleResize = () => {
            if ( canvasRef.current ) {
                bufferCanvasRef.current.width = canvasRef.current.width;
                bufferCanvasRef.current.height = canvasRef.current.height;
                setCanvasHeight( canvasRef.current.height );
            }
        };

        handleResize();
        window.addEventListener( 'resize', handleResize );

        return () => {
            window.removeEventListener( 'resize', handleResize );
        };
    }, [] );

    // Rendering loop for continious scrolling: new notes at drawn at the bottom of the canvas after the whole canvas has been moved up by a copy
    useEffect( () => {
        if ( !canvasHeight ) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext( '2d' );
        const bufferCanvas = bufferCanvasRef.current;
        const bufferCtx = bufferCanvas.getContext( '2d' );
        const canvasWidth = canvas.width;
        const noteWidth = canvasWidth / NUMBER_OF_NOTES;
        const y = canvasHeight - NOTE_HEIGHT;

        bufferCanvas.width = canvasWidth;
        bufferCanvas.height = canvasHeight;

        const drawNotes = () => {
            // Clear buffer canvas
            bufferCtx.clearRect( 0, 0, canvasWidth, canvasHeight );

            // Scrolling: draw previous frame shifted upwards by note height
            bufferCtx.drawImage(
                canvas,
                0,
                NOTE_HEIGHT,
                canvasWidth,
                canvasHeight - NOTE_HEIGHT,
                0,
                0,
                canvasWidth,
                canvasHeight - NOTE_HEIGHT
            );

            // Draw new notes
            [
                ...Object.entries( playingExtraNotes ),
                ...Object.entries( notesOn )
            ].forEach( ( [ key, velocity ] ) => {
                const pitch = parseInt( key, 10 );
                const x = ( pitch - LOWEST_PITCH ) * noteWidth;

                // Calculate hue based on pitch (lowest notes are red, highest are violet)
                const hue = mapRange( pitch, LOWEST_PITCH, 108, 0, 300 );

                // Calculate luminosity based on velocity and clamp to easily seen range
                const luminosity = Math.max( 30, Math.min( 110, ( velocity / 127 ) * 100 ) );

                bufferCtx.fillStyle = `hsl(${ hue }, 100%, ${ luminosity }%)`;
                bufferCtx.fillRect( x, y, noteWidth, NOTE_HEIGHT );
            } );

            // Clear main canvas
            ctx.clearRect( 0, 0, canvasWidth, canvasHeight );

            // Draw buffer canvas at the top of the main canvas
            ctx.drawImage( bufferCanvas, 0, 0 );

            // Request next animation frame
            requestIdRef.current = requestAnimationFrame( drawNotes );
        };

        // Start animation loop
        requestIdRef.current = requestAnimationFrame( drawNotes );

        return () => {
            // Clean up: cancel animation frame on component unmount
            if ( requestIdRef.current ) {
                cancelAnimationFrame( requestIdRef.current );
            }
        };
    }, [ canvasHeight, notesOn, playingExtraNotes ] );

    function mapRange ( value, minIn, maxIn, minOut, maxOut ) {
        return ( ( value - minIn ) * ( maxOut - minOut ) ) / ( maxIn - minIn ) + minOut;
    }

    useEffect( () => {
        const handleNoteEvent = ( event ) => {
            if ( event.type === EVENT_NOTE_START ) {
                console.debug( 'received', event.detail.pitch )
                setPlayingExtraNotes( ( prevEvents ) => ( {
                    ...prevEvents,
                    [ event.detail.pitch ]: event.detail.velocity,
                } ) );
            }

            if ( event.type === EVENT_NOTE_STOP ) {
                setPlayingExtraNotes( ( prevEvents ) => {
                    const newEvents = { ...prevEvents };
                    delete newEvents[ event.detail.pitch ];
                    return newEvents;
                } );
            }
        };

        window.addEventListener( EVENT_NOTE_START, handleNoteEvent );
        window.addEventListener( EVENT_NOTE_STOP, handleNoteEvent );

        return () => {
            window.removeEventListener( EVENT_NOTE_START, handleNoteEvent );
            window.removeEventListener( EVENT_NOTE_STOP, handleNoteEvent );
        };
    }, [] );

    return (
        <section className={ styles[ 'canvas-component' ] }>
            <canvas ref={ canvasRef } className={ styles.canvas }></canvas>
            <canvas ref={ bufferCanvasRef } style={ { display: 'none' } }></canvas>
        </section>
    );
}
