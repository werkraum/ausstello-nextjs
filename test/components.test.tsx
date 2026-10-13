import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
    notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
    },
}));

const { AusstelloDetail, AusstelloList, AusstelloTeaser, cspSources, detailMetadata, listMetadata } = await import('../src/index');

const envelope = (status = 200) => ({
    version: 2, status, html: '<div class="ausstello">Inhalt</div>',
    head: { title: 'Termine', canonical: 'https://kunde.de/v' }, assets: { css: [], js: [], inlineCss: '' }, cache: { maxAge: 60 },
});

beforeEach(() => {
    vi.stubEnv('AUSSTELLO_BACKEND_URL', 'https://b.de');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

const stubFetch = (status: number, body: unknown) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

describe('AusstelloList', () => {
    it('rendert das Fragment und reicht searchParams als Promise durch', async () => {
        const fetchMock = stubFetch(200, envelope());
        const html = renderToStaticMarkup(await AusstelloList({ basePath: '/v', searchParams: Promise.resolve({ page: '2' }) }));
        expect(html).toContain('<div class="ausstello">Inhalt</div>');
        expect(fetchMock.mock.calls[0]![0]).toBe('https://b.de/einbettung/v2/liste?base=%2Fv&page=2');
    });

    it('rendert fallback, wenn das Backend ausfällt', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
        const html = renderToStaticMarkup(await AusstelloList({ basePath: '/v', fallback: <p>Termine gerade nicht verfügbar</p> }));
        expect(html).toBe('<p>Termine gerade nicht verfügbar</p>');
    });

    it('rendert bei 404 nichts', async () => {
        stubFetch(404, envelope(404));
        expect(renderToStaticMarkup(await AusstelloList({ basePath: '/v' }))).toBe('');
    });

    it('wirft ohne AUSSTELLO_BACKEND_URL', async () => {
        vi.stubEnv('AUSSTELLO_BACKEND_URL', '');
        await expect(AusstelloList({ basePath: '/v' })).rejects.toThrow(/AUSSTELLO_BACKEND_URL ist nicht gesetzt/);
    });
});

describe('AusstelloTeaser', () => {
    it('fragt view=teaser ab', async () => {
        const fetchMock = stubFetch(200, envelope());
        await AusstelloTeaser({ basePath: '/v', perPage: 3 });
        expect(fetchMock.mock.calls[0]![0]).toBe('https://b.de/einbettung/v2/liste?base=%2Fv&perPage=3&view=teaser');
    });
});

describe('AusstelloDetail', () => {
    it('ruft die Detailadresse ab', async () => {
        const fetchMock = stubFetch(200, envelope());
        await AusstelloDetail({ segment: 'konzert-1', basePath: '/v' });
        expect(fetchMock.mock.calls[0]![0]).toBe('https://b.de/einbettung/v2/termin/konzert-1?base=%2Fv');
    });

    it('404 ⇒ notFound()', async () => {
        stubFetch(404, envelope(404));
        await expect(AusstelloDetail({ segment: 'gibt-es-nicht', basePath: '/v' })).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('ungültiges Segment ⇒ notFound() ohne Abruf', async () => {
        const fetchMock = stubFetch(200, envelope());
        await expect(AusstelloDetail({ segment: '../admin', basePath: '/v' })).rejects.toThrow('NEXT_NOT_FOUND');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('Metadata', () => {
    it('listMetadata bildet den Kopf ab', async () => {
        stubFetch(200, envelope());
        expect(await listMetadata({ basePath: '/v' })).toEqual({ title: 'Termine', alternates: { canonical: 'https://kunde.de/v' } });
    });

    it('listMetadata liefert {} bei Ausfall', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')));
        expect(await listMetadata({ basePath: '/v' })).toEqual({});
    });

    it('detailMetadata ⇒ notFound() bei 404', async () => {
        stubFetch(404, envelope(404));
        await expect(detailMetadata({ segment: 'x', basePath: '/v' })).rejects.toThrow('NEXT_NOT_FOUND');
    });
});

describe('cspSources', () => {
    it('liefert den Origin des Backends', () => {
        vi.stubEnv('AUSSTELLO_BACKEND_URL', 'https://mein.ausstello.de/unterpfad/');
        expect(cspSources()).toBe('https://mein.ausstello.de');
    });
});
