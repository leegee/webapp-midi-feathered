const LOCAL_SAVE_FREQ_MS = 10000;

export const localStorageOr = ( fieldName, defaultValue ) => {
    const val = localStorage.getItem( fieldName );
    return val !== null && typeof val !== 'undefined' ? Number( val ) : defaultValue;
}

export const saveNow = ( thingsToSave ) => {
    for ( let key of Object.keys( thingsToSave ) ) {
        localStorage.setItem( key, thingsToSave[ key ] );
    }
}

export const savePeriodically = ( thingsToSave ) => {
    const saveIntervalTimer = setInterval( () => {
        for ( let key of Object.keys( thingsToSave ) ) {
            localStorage.setItem( key, thingsToSave[ key ] );
        }
    }, LOCAL_SAVE_FREQ_MS );
    return () => clearInterval( saveIntervalTimer );
}
