import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config';

describe('readConfig', () => {
    it('liest Adresse und Vorgaben', () => {
        expect(readConfig({ AUSSTELLO_BACKEND_URL: 'https://mein.ausstello.de/' })).toEqual({
            backendUrl: 'https://mein.ausstello.de',
            timeout: 3,
            cacheMaxLifetime: 300,
        });
    });

    it('übernimmt Zeitlimit und Obergrenze', () => {
        const config = readConfig({ AUSSTELLO_BACKEND_URL: 'https://a.de', AUSSTELLO_TIMEOUT: '5', AUSSTELLO_CACHE_MAX_LIFETIME: '0' });
        expect(config.timeout).toBe(5);
        expect(config.cacheMaxLifetime).toBe(0);
    });

    it('fällt bei Unsinn auf die Vorgaben zurück', () => {
        const config = readConfig({ AUSSTELLO_BACKEND_URL: 'https://a.de', AUSSTELLO_TIMEOUT: 'abc', AUSSTELLO_CACHE_MAX_LIFETIME: '-1' });
        expect(config.timeout).toBe(3);
        expect(config.cacheMaxLifetime).toBe(300);
    });

    it('wirft ohne Adresse', () => {
        expect(() => readConfig({})).toThrow(/^ausstello: AUSSTELLO_BACKEND_URL ist nicht gesetzt/);
    });

    it('wirft bei Adresse ohne http(s)', () => {
        expect(() => readConfig({ AUSSTELLO_BACKEND_URL: 'mein.ausstello.de' })).toThrow(/^ausstello: AUSSTELLO_BACKEND_URL ist keine http\(s\)-Adresse/);
        expect(() => readConfig({ AUSSTELLO_BACKEND_URL: 'ftp://a.de' })).toThrow(/keine http\(s\)-Adresse/);
    });
});
