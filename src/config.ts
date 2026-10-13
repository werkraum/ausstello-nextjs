export type AusstelloConfig = {
    backendUrl: string;
    timeout: number;
    cacheMaxLifetime: number;
};

type Env = Record<string, string | undefined>;

export function readConfig(env: Env = process.env): AusstelloConfig {
    const raw = (env.AUSSTELLO_BACKEND_URL ?? '').trim();
    if (raw === '') {
        throw new Error('ausstello: AUSSTELLO_BACKEND_URL ist nicht gesetzt (z. B. https://mein.ausstello.de)');
    }
    let url: URL | null = null;
    try {
        url = new URL(raw);
    } catch {
        url = null;
    }
    if (url === null || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
        throw new Error(`ausstello: AUSSTELLO_BACKEND_URL ist keine http(s)-Adresse: ${raw}`);
    }

    return {
        backendUrl: raw.replace(/\/+$/, ''),
        timeout: number(env.AUSSTELLO_TIMEOUT, 3, 1),
        cacheMaxLifetime: number(env.AUSSTELLO_CACHE_MAX_LIFETIME, 300, 0),
    };
}

function number(raw: string | undefined, fallback: number, min: number): number {
    const value = raw === undefined || raw.trim() === '' ? Number.NaN : Number(raw);
    return Number.isFinite(value) && value >= min ? value : fallback;
}
