import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchEnvelope, fetchJson, fetchOptions } from '../src/client';
import type { AusstelloConfig } from '../src/config';

const config: AusstelloConfig = { backendUrl: 'https://b.de', timeout: 3, cacheMaxLifetime: 300 };
const envelope = { version: 2, status: 200, html: '<p>x</p>', head: {}, assets: {}, cache: { maxAge: 60 } };

const respond = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('fetchOptions', () => {
    it('cacht mit Obergrenze und Tag', () => {
        const options = fetchOptions({ ...config, cacheMaxLifetime: 30 }, 60) as RequestInit & { next?: { revalidate: number; tags: string[] } };
        expect(options.cache).toBe('force-cache');
        expect(options.next).toEqual({ revalidate: 30, tags: ['ausstello'] });
        expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('cacht nicht bei Obergrenze 0', () => {
        const options = fetchOptions({ ...config, cacheMaxLifetime: 0 }, 60) as RequestInit & { next?: unknown };
        expect(options.cache).toBe('no-store');
        expect(options.next).toBeUndefined();
    });
});

describe('fetchEnvelope', () => {
    it('ruft die richtige Adresse ab und liefert den Envelope', async () => {
        const fetchMock = respond(200, envelope);
        vi.stubGlobal('fetch', fetchMock);
        const outcome = await fetchEnvelope(config, 'liste', 'base=%2Fv');
        expect(fetchMock).toHaveBeenCalledWith('https://b.de/einbettung/v2/liste?base=%2Fv', expect.any(Object));
        expect(outcome.kind).toBe('ok');
    });

    it('lässt das Fragezeichen ohne Query weg', async () => {
        const fetchMock = respond(200, envelope);
        vi.stubGlobal('fetch', fetchMock);
        await fetchEnvelope(config, 'termin/x', '');
        expect(fetchMock.mock.calls[0]![0]).toBe('https://b.de/einbettung/v2/termin/x');
    });

    it('Envelope mit Status 404 ist nicht gefunden', async () => {
        vi.stubGlobal('fetch', respond(404, { ...envelope, status: 404 }));
        expect(await fetchEnvelope(config, 'termin/x', '')).toEqual({ kind: 'notFound' });
    });

    it.each([404, 400])('fremder %i ohne Envelope ist nicht gefunden', async (status) => {
        vi.stubGlobal('fetch', respond(status, '<html>Not Found</html>'));
        expect(await fetchEnvelope(config, 'termin/x', '')).toEqual({ kind: 'notFound' });
    });

    it.each([
        ['5xx', () => respond(503, envelope)],
        ['ungültiges JSON', () => respond(200, '{kaputt')],
        ['falsche Version', () => respond(200, { ...envelope, version: 3 })],
        ['Netzwerkfehler', () => vi.fn().mockRejectedValue(new TypeError('fetch failed'))],
        ['Zeitlimit', () => vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))],
    ])('%s ist nicht verfügbar', async (_label, make) => {
        vi.stubGlobal('fetch', make());
        expect(await fetchEnvelope(config, 'liste', '')).toEqual({ kind: 'unavailable' });
        expect(console.error).toHaveBeenCalled();
    });
});

describe('fetchJson', () => {
    it('liefert JSON bei 200', async () => {
        vi.stubGlobal('fetch', respond(200, { items: [] }));
        expect(await fetchJson(config, 'sitemap', 3600)).toEqual({ items: [] });
    });

    it('liefert null bei Fehlern', async () => {
        vi.stubGlobal('fetch', respond(500, 'x'));
        expect(await fetchJson(config, 'sitemap', 3600)).toBeNull();
    });
});
