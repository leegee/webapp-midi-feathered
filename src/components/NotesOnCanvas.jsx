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

        const startY = canvasHeight - NOTE_HEIGHT;

        bufferCanvas.width = canvasWidth;
        bufferCanvas.height = canvasHeight;

        const drawNotes = () => {
            // Clear buffer canvas
            bufferCtx.clearRect( 0, 0, canvasWidth, canvasHeight );

            // Scrolling: draw previous frame shifted upwards by note height
            bufferCtx.drawImage( canvas,
                0, NOTE_HEIGHT, canvasWidth, canvasHeight - NOTE_HEIGHT,
                0, 0, canvasWidth, canvasHeight - NOTE_HEIGHT
            );

            // Draw new notes
            Object.entries( notesOn ).forEach( ( [ key, value ] ) => {
                const pitch = parseInt( key, 10 );
                const velocity = value.velocity;

                // Calculate hue based on pitch (lowest notes are red, highest are violet)
                const hue = mapRange( pitch, LOWEST_PITCH, 108, 0, 300 );

                // Calculate luminosity based on velocity and clamp to reasonable range
                const luminosity = Math.max( 10, Math.min( 90, ( ( velocity / 127 ) * 100 ) ) );

                const colourStr = `hsl(${ hue }, 100%, ${ luminosity }%)`;

                const xPosition = ( pitch - LOWEST_PITCH ) * noteWidth;

                // Draw the note on the buffer canvas
                bufferCtx.fillStyle = colourStr;
                bufferCtx.fillRect( xPosition, startY, noteWidth, NOTE_HEIGHT );
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
    }, [ canvasHeight, notesOn ] );

    function mapRange ( value, minIn, maxIn, minOut, maxOut ) {
        return ( ( value - minIn ) * ( maxOut - minOut ) ) / ( maxIn - minIn ) + minOut;
    }

    return (
        <section className={ styles[ 'canvas-component' ] }>
            <canvas ref={ canvasRef } className={ styles.canvas }></canvas>
            <canvas ref={ bufferCanvasRef } style={ { display: 'none' } }></canvas>
        </section>
    );
}
