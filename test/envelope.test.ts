import { describe, expect, it } from 'vitest';
import { parseEnvelope } from '../src/envelope';

const valid = {
    version: 2,
    status: 200,
    html: '<div class="ausstello">x</div>',
    head: {
        title: 'Konzert',
        titleSuffix: 'Bad Urach',
        description: 'Beschreibung',
        canonical: 'https://kunde.de/veranstaltungen/konzert',
        robots: null,
        meta: [{ property: 'og:title', content: 'Konzert' }, { name: 'twitter:card', content: 'summary_large_image' }, { content: 'ohne Schlüssel' }],
        links: [{ rel: 'next', href: 'https://kunde.de/veranstaltungen?page=2' }, { rel: 'kaputt' }],
        jsonLd: [{ '@type': 'Event' }],
    },
    assets: { css: ['https://b.de/output/a.css'], js: [{ src: 'https://b.de/output/a.js', type: 'module' }, 'https://b.de/output/b.js'], inlineCss: ':root{}' },
    cache: { maxAge: 60 },
};

describe('parseEnvelope', () => {
    it('normalisiert einen gültigen Envelope', () => {
        const envelope = parseEnvelope(valid);
        expect(envelope).not.toBeNull();
        expect(envelope!.status).toBe(200);
        expect(envelope!.head.title).toBe('Konzert');
        expect(envelope!.head.robots).toBeNull();
        expect(envelope!.head.meta).toEqual([
            { key: 'og:title', content: 'Konzert' },
            { key: 'twitter:card', content: 'summary_large_image' },
        ]);
        expect(envelope!.head.links).toEqual([{ rel: 'next', href: 'https://kunde.de/veranstaltungen?page=2' }]);
        expect(envelope!.assets.js).toEqual([
            { src: 'https://b.de/output/a.js', type: 'module' },
            { src: 'https://b.de/output/b.js', type: 'module' },
        ]);
        expect(envelope!.maxAge).toBe(60);
    });

    it('nimmt leere Zeichenketten als nicht gesetzt', () => {
        expect(parseEnvelope({ ...valid, head: { ...valid.head, title: '' } })!.head.title).toBeNull();
    });

    it.each([
        ['falsche Version', { ...valid, version: 1 }],
        ['Status kein Integer', { ...valid, status: '200' }],
        ['html fehlt', { ...valid, html: undefined }],
        ['head kein Objekt', { ...valid, head: [] }],
        ['assets fehlt', { ...valid, assets: null }],
        ['kein Objekt', 'kaputt'],
    ])('lehnt ab: %s', (_label, data) => {
        expect(parseEnvelope(data)).toBeNull();
    });

    it('nimmt 60 als maxAge, wenn cache fehlt', () => {
        expect(parseEnvelope({ ...valid, cache: undefined })!.maxAge).toBe(60);
    });
});
