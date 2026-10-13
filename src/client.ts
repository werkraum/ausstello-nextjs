import type { AusstelloConfig } from './config';
import { type Outcome, parseEnvelope } from './envelope';

export const CACHE_TAG = 'ausstello';
/** EnvelopeResponder::MAX_AGE – vor dem Abruf ist cache.maxAge noch unbekannt. */
export const ENVELOPE_MAX_AGE = 60;
/** #[Cache(smaxage: 3600)] an EnvelopeController::sitemap() */
export const SITEMAP_MAX_AGE = 3600;

const NOT_FOUND: Outcome = { kind: 'notFound' };
const UNAVAILABLE: Outcome = { kind: 'unavailable' };

export function fetchOptions(config: AusstelloConfig, maxAge: number): RequestInit {
    const signal = AbortSignal.timeout(config.timeout * 1000);
    const revalidate = Math.min(maxAge, config.cacheMaxLifetime);
    if (revalidate <= 0) {
        return { cache: 'no-store', signal };
    }
    // Schlägt eine Revalidierung fehl, liefert Next die alte Antwort weiter.
    return { cache: 'force-cache', next: { revalidate, tags: [CACHE_TAG] }, signal } as RequestInit;
}

function url(config: AusstelloConfig, path: string, query: string): string {
    return `${config.backendUrl}/einbettung/v2/${path}${query !== '' ? `?${query}` : ''}`;
}

export async function fetchEnvelope(config: AusstelloConfig, path: string, query: string): Promise<Outcome> {
    const target = url(config, path, query);
    let response: Response;
    try {
        response = await fetch(target, fetchOptions(config, ENVELOPE_MAX_AGE));
    } catch (error) {
        console.error('ausstello: Backend nicht erreichbar', target, error);
        return UNAVAILABLE;
    }
    if (response.status >= 500) {
        console.error(`ausstello: Backend antwortet mit ${response.status}`, target);
        return UNAVAILABLE;
    }
    let data: unknown = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    const envelope = parseEnvelope(data);
    if (envelope !== null) {
        return envelope.status === 404 ? NOT_FOUND : { kind: 'ok', envelope };
    }
    if (response.status === 404 || response.status === 400) {
        // Kein Envelope, sondern ein fremder 404/400: meist eine falsche AUSSTELLO_BACKEND_URL.
        console.warn(`ausstello: Backend antwortet ohne Envelope (${response.status}), als nicht gefunden behandelt`, target);
        return NOT_FOUND;
    }
    console.error(`ausstello: Antwort ist kein gültiger Envelope (${response.status})`, target);
    return UNAVAILABLE;
}

/** Für die Sitemap – einfaches JSON ohne Envelope. */
export async function fetchJson(config: AusstelloConfig, path: string, maxAge: number): Promise<unknown | null> {
    const target = url(config, path, '');
    try {
        const response = await fetch(target, fetchOptions(config, maxAge));
        if (response.status !== 200) {
            console.error(`ausstello: JSON-Abruf fehlgeschlagen (${response.status})`, target);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('ausstello: JSON-Abruf fehlgeschlagen', target, error);
        return null;
    }
}
