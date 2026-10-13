export type MetaTag = { key: string; content: string };

export type EnvelopeHead = {
    title: string | null;
    titleSuffix: string | null;
    description: string | null;
    canonical: string | null;
    robots: string | null;
    meta: MetaTag[];
    links: { rel: string; href: string }[];
    jsonLd: unknown[];
};

export type EnvelopeAssets = {
    css: string[];
    js: { src: string; type: string }[];
    inlineCss: string;
};

/** Die Antwort des Backends nach Vertrag Version 2 (EnvelopeResponder). */
export type Envelope = {
    status: number;
    html: string;
    head: EnvelopeHead;
    assets: EnvelopeAssets;
    maxAge: number;
};

export type Outcome = { kind: 'ok'; envelope: Envelope } | { kind: 'notFound' } | { kind: 'unavailable' };

export const VERSION = 2;

type Data = Record<string, unknown>;

const isRecord = (value: unknown): value is Data => typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);

export function parseEnvelope(data: unknown): Envelope | null {
    if (
        !isRecord(data)
        || data.version !== VERSION
        || !Number.isInteger(data.status)
        || typeof data.html !== 'string'
        || !isRecord(data.head)
        || !isRecord(data.assets)
    ) {
        return null;
    }
    const head = data.head;
    const assets = data.assets;
    const cache = isRecord(data.cache) ? data.cache : {};

    return {
        status: data.status as number,
        html: data.html,
        head: {
            title: text(head.title),
            titleSuffix: text(head.titleSuffix),
            description: text(head.description),
            canonical: text(head.canonical),
            robots: text(head.robots),
            meta: list(head.meta).flatMap((tag) => {
                if (!isRecord(tag)) {
                    return [];
                }
                const key = text(tag.property) ?? text(tag.name);
                return key === null ? [] : [{ key, content: String(tag.content ?? '') }];
            }),
            links: list(head.links).flatMap((link) =>
                isRecord(link) && typeof link.rel === 'string' && typeof link.href === 'string' ? [{ rel: link.rel, href: link.href }] : [],
            ),
            jsonLd: list(head.jsonLd),
        },
        assets: {
            css: list(assets.css).filter((href): href is string => typeof href === 'string' && href !== ''),
            js: list(assets.js).flatMap((script) => {
                if (typeof script === 'string' && script !== '') {
                    return [{ src: script, type: 'module' }];
                }
                if (isRecord(script) && typeof script.src === 'string' && script.src !== '') {
                    return [{ src: script.src, type: text(script.type) ?? 'module' }];
                }
                return [];
            }),
            inlineCss: typeof assets.inlineCss === 'string' ? assets.inlineCss : '',
        },
        maxAge: Number.isInteger(cache.maxAge) ? (cache.maxAge as number) : 60,
    };
}
