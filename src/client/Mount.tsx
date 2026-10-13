'use client';

import { useEffect } from 'react';

/**
 * Das Output-JS des Backends initialisiert nur beim Laden. Nach einer weichen
 * Navigation ist es schon geladen – dieses Ereignis lässt es das neue HTML einlesen.
 */
export function AusstelloMount(): null {
    useEffect(() => {
        document.dispatchEvent(new Event('ausstello:scan'));
    }, []);

    return null;
}
