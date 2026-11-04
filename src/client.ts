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

/**
 * Ab diesem Alter gilt ein Envelope aus dem Data-Cache als veraltet: Next liefert einen
 * abgelaufenen Eintrag noch einmal aus und erneuert ihn erst im Hintergrund - egal, wie
 * alt er ist. Eine lange nicht besuchte Seite zeigte so alten Inhalt und verwiese auf
 * Output-Assets, die das Backend längst aufgeräumt hat (ungestylte Seite bis zum Reload).
 * Spielraum: Data-Cache (revalidate) + Backend-Cache (ENVELOPE_MAX_AGE) + Uhrenabweichung.
 */
export function staleAfter(config: AusstelloConfig): number {
    return Math.min(ENVELOPE_MAX_AGE, config.cacheMaxLifetime) + ENVELOPE_MAX_AGE + 120;
}

export async function fetchEnvelope(config: AusstelloConfig, path: string, query: string): Promise<Outcome> {
    const outcome = await requestEnvelope(config, path, query, fetchOptions(config, ENVELOPE_MAX_AGE));
    if (outcome.kind !== 'ok' || outcome.envelope.generatedAt === null || config.cacheMaxLifetime <= 0) {
        return outcome;
    }
    const age = Math.floor(Date.now() / 1000) - outcome.envelope.generatedAt;
    if (age <= staleAfter(config)) {
        return outcome;
    }
    // Veraltet: frisch holen. Scheitert das, bleibt der alte Envelope - wie bei einem Ausfall.
    const fresh = await requestEnvelope(config, path, query, { cache: 'no-store', signal: AbortSignal.timeout(config.timeout * 1000) }, false);

    return fresh.kind === 'unavailable' ? outcome : fresh;
}

async function requestEnvelope(config: AusstelloConfig, path: string, query: string, init: RequestInit, log = true): Promise<Outcome> {
    const target = url(config, path, query);
    let response: Response;
    try {
        response = await fetch(target, init);
    } catch (error) {
        if (!log) {
            return UNAVAILABLE;
        }
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
