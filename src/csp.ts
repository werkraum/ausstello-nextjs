import 'server-only';
import { readConfig } from './config';

/**
 * Origin des Backends für die eigene Content-Security-Policy: Besucher laden
 * Stylesheets, Skripte, Bilder und Schriften von dort und schicken Anmeldungen
 * dorthin (script-src, style-src, img-src, font-src, connect-src).
 */
export function cspSources(): string {
    return new URL(readConfig().backendUrl).origin;
}
