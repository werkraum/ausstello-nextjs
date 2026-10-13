'use client';

import { useEffect } from 'react';

/**
 * Das Output-JS des Backends initialisiert nur beim Laden. Nach einer weichen
 * Navigation ist es schon geladen – dieses Ereignis lässt es das neue HTML einlesen.
 * Beim Verlassen der Seite feuert `ausstello:leave`; offene Filtermodals schließen dann.
 */
export function AusstelloMount(): null {
    useEffect(() => {
        document.dispatchEvent(new Event('ausstello:scan'));
        return () => {
            document.dispatchEvent(new Event('ausstello:leave'));
        };
    }, []);

    return null;
}
