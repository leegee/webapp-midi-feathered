import { useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { notesOnAtom } from '../lib/store';
import styles from './NotesOnCanvas.module.css';

const CANVAS_WIDTH = 88 * 9;
const CANVAS_HEIGHT = 100;
const NOTE_HEIGHT = 5;
const RENDER_INTERVAL = 50;

export default function NoteList () {
    const [ notesOn ] = useAtom( notesOnAtom );
    const canvasRef = useRef( null );
    const bufferCanvasRef = useRef( null ); // Buffer canvas to optimize rendering

    useEffect( () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext( '2d' );
        const bufferCanvas = bufferCanvasRef.current;
        const bufferCtx = bufferCanvas.getContext( '2d' );
        const width = canvas.width;

        // Initialize buffer canvas
        bufferCanvas.width = width;
        bufferCanvas.height = CANVAS_HEIGHT;

        // Function to draw the notes
        const drawNotes = () => {
            // Clear buffer canvas
            bufferCtx.clearRect( 0, 0, width, CANVAS_HEIGHT );

            // Copy current canvas content to buffer canvas shifted upwards
            bufferCtx.drawImage( canvas, 0, NOTE_HEIGHT, width, CANVAS_HEIGHT - NOTE_HEIGHT, 0, 0, width, CANVAS_HEIGHT - NOTE_HEIGHT );

            // Draw new notes at the bottom with fixed height (NOTE_HEIGHT)
            Object.entries( notesOn ).forEach( ( [ key, value ] ) => {
                const pitch = parseInt( key, 10 );

                // Calculate y position based on time and render interval
                const startY = CANVAS_HEIGHT - NOTE_HEIGHT;
                const noteHeight = NOTE_HEIGHT;

                // Calculate x position based on MIDI note value
                const xPosition = ( pitch - 21 ) * ( width / 88 ); // MIDI note range 21-108

                // Draw the note rectangle on buffer canvas
                bufferCtx.fillStyle = 'white';
                bufferCtx.fillRect( xPosition, startY, width / 88, noteHeight );
            } );

            // Clear main canvas
            ctx.clearRect( 0, 0, width, CANVAS_HEIGHT );

            // Draw buffer canvas at the top of the main canvas
            ctx.drawImage( bufferCanvas, 0, 0 );
        };

        // Render loop
        const renderLoop = setInterval( () => {
            drawNotes();
        }, RENDER_INTERVAL );

        return () => {
            clearInterval( renderLoop );
        };
    }, [ notesOn ] );

    return (
        <section className={ styles.canvas }>
            <canvas ref={ canvasRef } width={ CANVAS_WIDTH } height={ CANVAS_HEIGHT }></canvas>
            <canvas ref={ bufferCanvasRef } style={ { display: 'none' } }></canvas>
        </section>
    );
}
