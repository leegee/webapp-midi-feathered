import { useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { notesOnAtom, featheredNotesOnAtom } from '../lib/store';
import styles from './NotesOnCanvas.module.css';

const CANVAS_WIDTH = 88 * 9;
const CANVAS_HEIGHT = 100;
const NOTE_HEIGHT = 1;

export default function NoteList () {
    const [ notesOn ] = useAtom( notesOnAtom );
    const [ featheredNotesOn ] = useAtom( featheredNotesOnAtom );
    const canvasRef = useRef( null );
    const bufferCanvasRef = useRef( null ); // Buffer canvas to optimize rendering
    const requestIdRef = useRef( null );

    useEffect( () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext( '2d' );
        const bufferCanvas = bufferCanvasRef.current;
        const bufferCtx = bufferCanvas.getContext( '2d' );
        const width = canvas.width;

        bufferCanvas.width = width;
        bufferCanvas.height = CANVAS_HEIGHT;

        const drawNotes = () => {
            // Clear buffer canvas
            bufferCtx.clearRect( 0, 0, width, CANVAS_HEIGHT );

            // Scrolling: draw previous frame shifted upwards by note height
            bufferCtx.drawImage( canvas, 0, NOTE_HEIGHT, width, CANVAS_HEIGHT - NOTE_HEIGHT, 0, 0, width, CANVAS_HEIGHT - NOTE_HEIGHT );

            // Draw new notes
            Object.entries( notesOn ).forEach( ( [ key, value ] ) => {
                const pitch = parseInt( key, 10 );
                const velocity = value.velocity;

                // Calculate hue based on pitch (lowest notes are red, highest are violet)
                const hue = mapRange( pitch, 21, 108, 0, 300 );

                // Calculate luminosity based on velocity and clamp to 2-99
                const luminosity = Math.max( 2, Math.min( 99, ( ( velocity / 127 ) * 100 ) ) );

                const colourStr = `hsl(${ hue }, 100%, ${ luminosity }%)`;

                const startY = CANVAS_HEIGHT - NOTE_HEIGHT;
                const noteHeight = NOTE_HEIGHT;
                const xPosition = ( pitch - 21 ) * ( width / 88 );

                // Draw the note on the buffer canvas
                bufferCtx.fillStyle = colourStr;
                bufferCtx.fillRect( xPosition, startY, width / 88, noteHeight );
            } );

            // Clear main canvas
            ctx.clearRect( 0, 0, width, CANVAS_HEIGHT );

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
    }, [ notesOn ] );

    function mapRange ( value, minIn, maxIn, minOut, maxOut ) {
        return ( ( value - minIn ) * ( maxOut - minOut ) ) / ( maxIn - minIn ) + minOut;
    }

    return (
        <section className={ styles.canvas }>
            <canvas ref={ canvasRef } width={ CANVAS_WIDTH } height={ CANVAS_HEIGHT }></canvas>
            <canvas ref={ bufferCanvasRef } style={ { display: 'none' } }></canvas>
        </section>
    );
}
