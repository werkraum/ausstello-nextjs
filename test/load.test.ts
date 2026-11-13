import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Außerhalb eines Server-Renderings memoisiert React `cache` nicht. Hier merkt sich ein
// Ersatz die Ergebnisse nach den Argumenten, so wie React es je Seitenaufruf tut.
vi.mock('react', async (original) => {
    const react = await original<typeof import('react')>();
    const cache = <A extends unknown[], R>(fn: (...args: A) => R) => {
        const seen = new Map<string, R>();
        return (...args: A): R => {
            const key = JSON.stringify(args);
            if (!seen.has(key)) {
                seen.set(key, fn(...args));
            }
            return seen.get(key)!;
        };
    };
    return { ...react, cache };
});

const { loadDetail, loadList, loadTeaser } = await import('../src/load');

const envelope = { version: 2, status: 200, html: '<p>x</p>', head: {}, assets: {}, cache: { maxAge: 60 } };

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
    vi.stubEnv('AUSSTELLO_BACKEND_URL', 'https://b.de');
    fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(envelope), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

const urls = () => fetchMock.mock.calls.map((call) => call[0] as string);

describe('load', () => {
    it('zwei Backends, zwei Abrufe; gleiches Backend teilt den Abruf', async () => {
        await loadList({ basePath: '/a' });
        await loadList({ basePath: '/a' }, undefined, 'https://sig.de');
        await loadList({ basePath: '/a' }, undefined, 'https://sig.de');
        expect(urls()).toEqual(['https://b.de/einbettung/v2/liste?base=%2Fa', 'https://sig.de/einbettung/v2/liste?base=%2Fa']);
    });

    it('normalisiert den Schrägstrich, bevor er in den Schlüssel geht', async () => {
        await loadTeaser({ basePath: '/t' }, 'https://sig.de');
        await loadTeaser({ basePath: '/t' }, 'https://sig.de/');
        expect(urls()).toHaveLength(1);
    });

    it('Detail mit backendUrl fragt dort an', async () => {
        await loadDetail('konzert-1', '/d', 'https://sig.de');
        expect(urls()[0]).toMatch(/^https:\/\/sig\.de\/einbettung\/v2\/termin\/konzert-1\?/);
    });
});
