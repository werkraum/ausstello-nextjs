import 'server-only';
import { readConfig } from './config';

/**
 * Origin des Backends für die eigene Content-Security-Policy: Besucher laden
 * Stylesheets, Skripte, Bilder und Schriften von dort und schicken Anmeldungen
 * dorthin (script-src, style-src, img-src, font-src, connect-src). Weitere Backends
 * (backendUrl an Komponenten) als Argumente; jeder Origin kommt einmal vor.
 */
export function cspSources(...backendUrls: string[]): string {
    const origins = [readConfig(), ...backendUrls.map((url) => readConfig(process.env, url))].map((config) => new URL(config.backendUrl).origin);

    return [...new Set(origins)].join(' ');
}
