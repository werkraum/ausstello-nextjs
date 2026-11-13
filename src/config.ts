export type AusstelloConfig = {
    backendUrl: string;
    timeout: number;
    cacheMaxLifetime: number;
};

type Env = Record<string, string | undefined>;

/**
 * Liest die Umgebung. `backendUrl` (Prop einer Komponente oder Option eines Helfers)
 * übersteuert nur die Adresse; AUSSTELLO_BACKEND_URL bleibt trotzdem Pflicht, Zeitlimit
 * und Cache-Obergrenze gelten für alle Backends.
 */
export function readConfig(env: Env = process.env, backendUrl?: string): AusstelloConfig {
    const global = address(env.AUSSTELLO_BACKEND_URL, 'AUSSTELLO_BACKEND_URL', 'ist nicht gesetzt (z. B. https://mein.ausstello.de)');

    return {
        backendUrl: backendUrl === undefined ? global : address(backendUrl, 'backendUrl', 'ist leer'),
        timeout: number(env.AUSSTELLO_TIMEOUT, 3, 1),
        cacheMaxLifetime: number(env.AUSSTELLO_CACHE_MAX_LIFETIME, 300, 0),
    };
}

function address(value: string | undefined, name: string, missing: string): string {
    const raw = (value ?? '').trim();
    if (raw === '') {
        throw new Error(`ausstello: ${name} ${missing}`);
    }
    let url: URL | null = null;
    try {
        url = new URL(raw);
    } catch {
        url = null;
    }
    if (url === null || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
        throw new Error(`ausstello: ${name} ist keine http(s)-Adresse: ${raw}`);
    }

    return raw.replace(/\/+$/, '');
}

function number(raw: string | undefined, fallback: number, min: number): number {
    const value = raw === undefined || raw.trim() === '' ? Number.NaN : Number(raw);
    return Number.isFinite(value) && value >= min ? value : fallback;
}
