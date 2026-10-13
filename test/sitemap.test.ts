import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sitemapEntries } from '../src/sitemap';

beforeEach(() => {
    vi.stubEnv('AUSSTELLO_BACKEND_URL', 'https://b.de');
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('sitemapEntries', () => {
    it('bildet loc/lastmod ab und verwirft Kaputtes', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
            items: [
                { loc: 'https://kunde.de/v/a', lastmod: '2026-10-01T10:00:00+02:00' },
                { loc: 'https://kunde.de/v/b', lastmod: null },
                { lastmod: '2026-10-01' },
            ],
        }))));
        expect(await sitemapEntries()).toEqual([
            { url: 'https://kunde.de/v/a', lastModified: '2026-10-01T10:00:00+02:00' },
            { url: 'https://kunde.de/v/b' },
        ]);
    });

    it('liefert [] bei Ausfall', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')));
        expect(await sitemapEntries()).toEqual([]);
    });
});
