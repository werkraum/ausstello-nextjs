import { describe, expect, it } from 'vitest';
import type { EnvelopeHead } from '../src/envelope';
import { toMetadata } from '../src/head';

const head = (overrides: Partial<EnvelopeHead> = {}): EnvelopeHead => ({
    title: null, titleSuffix: null, description: null, canonical: null, robots: null, meta: [], links: [], jsonLd: [], ...overrides,
});

describe('toMetadata', () => {
    it('leerer Kopf ergibt leere Metadata', () => {
        expect(toMetadata(head())).toEqual({});
    });

    it('Titel mit Suffix ist absolut', () => {
        expect(toMetadata(head({ title: 'Konzert', titleSuffix: 'Bad Urach' })).title).toEqual({ absolute: 'Konzert – Bad Urach' });
    });

    it('Titel ohne Suffix lässt das Template des Layouts greifen', () => {
        expect(toMetadata(head({ title: 'Konzert' })).title).toBe('Konzert');
    });

    it('Suffix ohne Titel setzt nichts', () => {
        expect(toMetadata(head({ titleSuffix: 'Bad Urach' })).title).toBeUndefined();
    });

    it('Beschreibung und Canonical', () => {
        const metadata = toMetadata(head({ description: 'Text', canonical: 'https://kunde.de/v/a' }));
        expect(metadata.description).toBe('Text');
        expect(metadata.alternates).toEqual({ canonical: 'https://kunde.de/v/a' });
    });

    it.each([
        ['noindex, follow', 'noindex, follow'],
        ['index, nofollow', 'index, nofollow'],
        ['index, follow', undefined],
    ])('robots %s → %s', (robots, expected) => {
        expect(toMetadata(head({ robots })).robots).toBe(expected);
    });

    it('bildet Open Graph mit mehreren Bildern ab', () => {
        const metadata = toMetadata(head({
            meta: [
                { key: 'og:type', content: 'website' },
                { key: 'og:title', content: 'Konzert' },
                { key: 'og:description', content: 'Text' },
                { key: 'og:url', content: 'https://kunde.de/v/a' },
                { key: 'og:image', content: 'https://b.de/1.jpg' },
                { key: 'og:image:width', content: '1200' },
                { key: 'og:image:height', content: '630' },
                { key: 'og:image:alt', content: 'Bühne' },
                { key: 'og:image', content: 'https://b.de/2.jpg' },
            ],
        }));
        expect(metadata.openGraph).toEqual({
            type: 'website',
            title: 'Konzert',
            description: 'Text',
            url: 'https://kunde.de/v/a',
            images: [
                { url: 'https://b.de/1.jpg', width: 1200, height: 630, alt: 'Bühne' },
                { url: 'https://b.de/2.jpg' },
            ],
        });
    });

    it('erste Angabe je Schlüssel gewinnt', () => {
        const metadata = toMetadata(head({ meta: [{ key: 'og:title', content: 'A' }, { key: 'og:title', content: 'B' }] }));
        expect((metadata.openGraph as { title: string }).title).toBe('A');
    });

    it('bildet twitter:* und Übriges ab', () => {
        const metadata = toMetadata(head({
            meta: [
                { key: 'twitter:card', content: 'summary_large_image' },
                { key: 'twitter:title', content: 'T' },
                { key: 'geo.region', content: 'DE-BW' },
                { key: 'geo.region', content: 'DE-BY' },
            ],
        }));
        expect(metadata.twitter).toEqual({ card: 'summary_large_image', title: 'T' });
        expect(metadata.other).toEqual({ 'geo.region': ['DE-BW', 'DE-BY'] });
    });
});
