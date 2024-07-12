export const probabilityTriangular = ( min, max, mode ) => {
    mode = mode || ( min + ( max - min ) / 2 );
    const u = Math.random();

    if ( u < ( mode - min ) / ( max - min ) ) {
        return min + Math.sqrt( u * ( max - min ) * ( mode - min ) );
    } else {
        return max - Math.sqrt( ( 1 - u ) * ( max - min ) * ( max - mode ) );
    }
}

export const percentage = ( real ) => Math.floor( real * 100 );

// const ms2bpm = ( n ) => 60000 / Number( n );
// const ms2bps = ( n ) => 600 / Number( n );

